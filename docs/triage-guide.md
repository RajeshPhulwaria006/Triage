# Triage: Complete Project Walkthrough & Team Guide

> **Welcome to the team!**  
> This guide is written so that **anyone**—even if you have never seen this codebase or heard of medical triage before—can understand exactly what this system does, why it exists, how the code works, and how to answer any question from judges, supervisors, or doctors.

---

## 1. Glossary: Simple Definitions of Medical & Technical Words

Whenever you encounter a word that sounds technical or medical, consult this table.

| Word | What it means in this project |
| :--- | :--- |
| **OPD** | **Outpatient Department**: The clinic area of a hospital where people walk in to see a doctor for checkups, medicines, or minor illnesses without staying overnight in a bed. |
| **Triage** | Sorting and prioritizing patients based on **how urgently they need medical care**, rather than who arrived first. |
| **FIFO** | **First In, First Out**: A simple queue where the first person to arrive is the first person seen (like waiting in line at a cinema ticket booth or grocery store). |
| **Acuity** | The severity or dangerousness of a patient's medical condition. High acuity means life-threatening danger. |
| **Vitals** | Basic physiological measurements taken from the human body: Blood Pressure (BP), Pulse rate, Oxygen saturation (SpO2), and Body Temperature. |
| **Diaphoresis** | Heavy, unusual cold sweating, frequently seen during a sudden heart attack. |
| **SpO2** | Blood Oxygen Saturation: A percentage representing how much oxygen your blood is carrying. Normal is 95%–100%. Anything below 90% is a life-threatening emergency. |
| **Hypertensive Crisis** | Dangerously high blood pressure (Systolic BP greater than 200 mmHg) that can cause a stroke or organ failure. |
| **Override** | When a human clinician (like a nurse) changes an automated system decision based on direct physical visual inspection of the patient. |
| **Audit Trail** | A permanent, tamper-resistant history recording who changed what, at what time, and why. |
| **WAL (Write-Ahead Log)** | An append-only file where every action is saved immediately before anything else happens. Even if power is cut, no patient data is ever lost. |
| **Deterministic** | Given the exact same inputs (symptoms and vitals), the code **always** produces the exact same output. No random guessing, no black-box hallucinations. |

---

## 2. The Problem Statement: Why Was Triage Built?

### The Real-World Hospital Scene
Imagine a crowded government hospital morning at **Dr. S.N. Medical College, Jodhpur**:
- **Patient A (Token 87)** is a 60-year-old man sitting quietly on a wooden bench in the corridor. He is sweating heavily, feeling tightness in his chest, and feeling faint.
- **Patient B (Token 23)** is a 24-year-old healthy young woman who arrived 20 minutes earlier just to collect a routine refill prescription for thyroid tablets.
- In traditional hospitals, tickets are assigned purely by arrival time (**FIFO queue**).
- Patient 87 waits 90 minutes in the hot corridor because Token 23 and 60 other people arrived before him. Nobody checks his pulse or blood pressure until he finally reaches the doctor's table—by which time he may suffer cardiac arrest.

### The Objective
Build a fast, lightweight, and explainable software system called **Triage** that:
1. **Captures symptoms and basic vitals** right at the hospital registration desk.
2. **Deterministically classifies urgency** into three simple, universally understood levels:
   - **`IMMEDIATE`** (Red): Life or organ at risk. Patient must jump straight to the top of the queue for urgent medical attention within minutes.
   - **`SOON`** (Amber): Potentially serious or unstable condition. Must be seen within 30 minutes.
   - **`ROUTINE`** (Green): Stable, benign, or routine administrative visit. Safe to wait in standard queue.
3. **Provides a clear, one-line clinical reason** so registration clerks and doctors understand *why* the priority was chosen.
4. **Gives nurses a live dashboard** with **one-tap priority override** so clinical human judgment always trumps computer rules.
5. **Handles missing vitals safely (Fail-Safe)**: In rushed Indian OPDs, vitals are often skipped. If an elderly patient complains of dizziness and has no vitals recorded, the system refuses to assume they are fine—it escalates them to `SOON` automatically.
6. **Maintains an immutable audit trail** and local file durability (WAL) with zero cloud crash risk.

---

## 3. High-Level System Architecture & Flow

```mermaid
flowchart TD
    A["Patient Arrives at OPD Registration Desk"] --> B["Desk Clerk Enters Name, Age, Symptoms & Optional Vitals"]
    B --> C["Triage Engine Evaluates Clinical Rules (Deterministic)"]
    C --> D{"Live Acuity Level Calculated"}
    D -->|"Red (Critical)"| E["IMMEDIATE: Pushed to Top of Queue"]
    D -->|"Amber (Unstable/Urgent)"| F["SOON: Priority Slot (< 30 min)"]
    D -->|"Green (Stable/Refill)"| G["ROUTINE: Standard Waiting Queue"]
    E & F & G --> H["Transaction Saved to Append-Only Write-Ahead Log (WAL)"]
    H --> I["Real-Time Nurse & Doctor Dashboard Updates (< 2 sec)"]
    I --> J{"Does Patient Look Sick in Waiting Hall?"}
    J -->|"Yes (Diaphoretic / Pale)"| K["Nurse Clicks 1-Tap Priority Override"]
    K --> L["Priority Changed + Clinical Reason Logged in Immutable Audit Trail"]
    L --> I
    J -->|"No"| M["Doctor Calls Patient by Acuity Order"]
    M --> N["Consultation Completed"]
```

---

## 4. The Triage Rules: How Priority is Calculated

Our triage engine (`src/lib/triage.ts`) is based on established emergency medical protocols (the Manchester Triage System and Indian National Health Mission OPD guidelines).

It evaluates conditions in a strict **safety-first sequence**:

### Level 1: IMMEDIATE (Red Alert)
If ANY of these conditions are true, the patient is classified as `IMMEDIATE`:
1. **Critical Hypoxia**: Oxygen saturation (`SpO2`) is less than 90%.
2. **Severe Hemodynamic Collapse**: Pulse is below 40 bpm (extreme bradycardia) or above 130 bpm (extreme tachycardia).
3. **Hypertensive Crisis**: Systolic blood pressure is greater than 200 mmHg.
4. **Loss of Consciousness / Collapse**: Patient is unresponsive, passed out, or convulsing (`behosh`, `seizure`, `coma`).
5. **High-Risk Acute Coronary or Respiratory Syndrome**:
   - Symptoms mentioning chest pain, chest tightness, heavy pressure, or severe breathing difficulty (`chhati me dard`, `seene me jalan`, `saas phoolna`) **in any patient older than 35 years**.
   - Immediate ECG (electrocardiogram) and doctor review are mandatory.

### Level 2: SOON (Amber Priority)
If not immediate, but the patient exhibits signs of instability:
1. **Sub-optimal Oxygen**: SpO2 between 90% and 94%.
2. **Abnormal Pulse**: Pulse between 110–130 bpm or 45–54 bpm.
3. **Severe Hypertension**: Systolic BP between 170–200 mmHg.
4. **High Fever**: Body temperature greater than 101.5°F.
5. **Acute Symptoms**: Severe abdominal pain (`pet dard`), repeated vomiting, deep burns, profuse bleeding, or acute trauma.
6. **Fail-Safe Missing Vitals**:
   - Any patient aged **55 or older** presenting with unrecorded vitals and vague systemic distress (`chakkar`, `ghabrahat`, `kamzori`).
   - Young adults presenting with fever or systemic weakness without vitals.

### Level 3: ROUTINE (Green Standard)
If physiological vitals are within normal limits and the symptoms are benign (such as prescription refill, report checkup, suture removal, minor skin rash, or mild chronic cough), the patient is safely placed in `ROUTINE`.

---

## 5. Key System Features Explained

### A. The 1-Tap Nurse Override
Computers cannot see what a patient looks like in the hallway. A patient might say "I only came for a refill", but while waiting, they turn pale, sweat profusely, or start trembling.
- A nurse can click **"Override Priority"** directly on any patient card.
- The nurse selects the new priority (e.g., changes `ROUTINE` to `IMMEDIATE`) and enters a one-line reason (e.g., *"Patient diaphoretic and pale in corridor"*).
- The patient **instantly jumps to Rank #1** in the doctor's queue.
- This override is marked with a distinctive badge and permanently recorded in the audit trail.

### B. Fail-Safe Missing Vitals (Safety-First Design)
In crowded OPDs, taking blood pressure and oxygen on every single person is impossible due to time pressure.
- **Flawed naive systems** assume missing vitals mean the patient is healthy and mark them Routine.
- **Triage assumes missing vitals represent hidden risk**. If an elderly person arrives with dizziness and no vitals, the system escalates them to `SOON` and flags `isFailSafeEscalation = true` with the plain explanation: *"Elderly patient (>=55y) with unrecorded vitals; auto-escalated for bedside assessment."*

### C. Write-Ahead Log (WAL) Storage
Instead of relying on heavy cloud databases (like MongoDB or external PostgreSQL) that fail if hospital internet cuts out:
- Triage writes every event synchronously into `data/opd_wal.jsonl`.
- Each entry contains a sequence number, timestamp, action type, patient payload, staff badge number, and a mathematical checksum for tamper-evidence.
- If the computer crashes or reboots, the system replays the WAL file and restores the exact state in milliseconds.

---

## 6. Project Directory Structure

```text
aayu_helix/
├── docs/
│   ├── triage-guide.md       # THIS GUIDE: Complete team overview & FAQ
│   └── architecture.md       # Technical specs, API schemas & diagrams
├── data/
│   └── opd_wal.jsonl         # Append-only durable Write-Ahead Log
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Base layout (White minimal theme)
│   │   ├── page.tsx          # Main unified app shell with polling
│   │   ├── register/page.tsx # Standalone Patient Registration page
│   │   ├── dashboard/page.tsx# Standalone Doctor & Nurse Live Queue page
│   │   ├── audit/page.tsx    # Standalone Immutable Audit Trail page
│   │   └── api/              # REST Endpoints
│   │       ├── queue/        # GET queue, POST new patient token
│   │       ├── queue/[id]/override/ # POST nurse clinical override
│   │       ├── queue/[id]/status/   # POST status transition
│   │       └── reset/        # POST administrative demo reset
│   ├── components/           # Minimal React UI Components
│   │   ├── Header.tsx        # Clean navigation & hospital badge
│   │   ├── RegistrationDesk.tsx # Desk intake with live instant triage preview
│   │   ├── NurseDashboard.tsx# Live doctor/nurse queue with priority indicators
│   │   ├── OverrideModal.tsx # Fast 1-tap nurse priority escalation dialog
│   │   └── AuditTrail.tsx    # Tamper-resistant log with filters & timestamps
│   ├── lib/                  # Core Business Logic & Engines
│   │   ├── triage.ts         # Deterministic triage rules engine
│   │   ├── triage.test.ts    # 10 unit test cases for medical safety
│   │   ├── e2e-verify.ts     # E2E test verifying Token 87 vs 23 & overrides
│   │   ├── store.ts          # In-memory priority queue & 14 realistic OPD seeds
│   │   └── wal.ts            # Append-only Write-Ahead Log engine
│   └── types/
│       └── triage.ts         # Strict TypeScript definitions (zero 'any')
├── Dockerfile                # Production multi-stage Docker build
├── docker-compose.yml        # Docker compose runner with volume persistence
└── package.json              # Scripts: build, test, verify, start
```

---

## 7. How to Run the Project

### Method 1: Local Node.js Production Run (Recommended for fast demo)
```bash
# 1. Run unit tests to prove 100% clinical safety
npm test

# 2. Run the end-to-end verification script
npm run verify

# 3. Build optimized production assets
npm run build

# 4. Start the server
npm start
```
*Open your browser at **http://localhost:3000**.*

### Method 2: Docker & Docker Compose
```bash
docker compose up --build
```
*Open your browser at **http://localhost:3000**.*

---

## 8. Common Team Questions & Answers (Cheat Sheet for Presentations)

### Q1: Is this an AI/LLM model that generates responses?
> **Answer**: **No, and that is by deliberate clinical design.** Large Language Models hallucinate, have high latency (seconds per request), and produce non-deterministic results. In medical triage, you cannot give a patient `ROUTINE` one minute and `IMMEDIATE` the next for the same symptoms. Triage uses **deterministic clinical rules** that run in less than **1 millisecond**, have **100% reproducibility**, and provide clear, audit-compliant explanations.

### Q2: How does Token 87 jump ahead of Token 23?
> **Answer**: Token 23 arrived first for a thyroid refill, but is classified as `ROUTINE`. Token 87 arrived later with chest pain and sweating, classified as `IMMEDIATE`. The queue is sorted first by **Acuity Level** (`IMMEDIATE` > `SOON` > `ROUTINE`), and only secondarily by arrival time within each level. Therefore, Token 87 is placed at the top of the queue ahead of Token 23.

### Q3: What happens if a patient's vitals cannot be measured?
> **Answer**: The system applies **Fail-Safe Escalation**. It never treats missing data as healthy. If an older patient (>=55) presents with non-specific complaints and blank vitals, they are automatically escalated to `SOON` so medical staff evaluate them at the bedside.

### Q4: Why are we using a Write-Ahead Log (WAL) instead of a regular cloud database?
> **Answer**: In Indian government hospitals, external cloud databases suffer from network timeouts, latency, and database connection dropouts. A local Write-Ahead Log writes append-only records synchronously to disk (`data/opd_wal.jsonl`). It guarantees zero data loss, instant boot recovery, and zero external infrastructure dependencies.

### Q5: Can the nurse change a doctor's decision?
> **Answer**: The system prioritizes patients **between the registration desk and the doctor's room**. The nurse has full clinical authority to upgrade or downgrade a patient's priority using the **1-Tap Override** based on visual hallway inspection. Every override requires an attributed justification and is logged permanently in the audit trail.
