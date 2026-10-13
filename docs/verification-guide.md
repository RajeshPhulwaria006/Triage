# 🧪 Verification & Self-Testing Guide for Triage

Use this guide to inspect, test, and verify the entire system, database, and logs.

---

## 1. Quick Verification Commands

### A. Check Running Containers
Run:
```bash
docker ps
```
You will see both containers healthy and up:
* `triage_postgres` (PostgreSQL 18 on port `5432`)
* `triage_app_service` (Next.js Triage App on port `3000`)

---

## 2. Inspecting the PostgreSQL Database & Data

### A. Open the PostgreSQL Interactive Shell
Run:
```bash
docker exec -it triage_postgres psql -U triage_user -d triage_db
```

### B. View Tables Created by `postgres.js`
Inside `psql`, run:
```sql
\dt
```
Output:
```text
 Schema |    Name    | Type  |    Owner    
--------+------------+-------+-------------
 public | audit_logs | table | triage_user
 public | patients   | table | triage_user
(2 rows)
```

### C. Check the Seeded Patient Queue
Run:
```sql
SELECT token_number, patient_name, age, current_priority, is_fail_safe_escalation 
FROM patients 
ORDER BY 
  CASE current_priority 
    WHEN 'IMMEDIATE' THEN 1 
    WHEN 'SOON' THEN 2 
    ELSE 3 
  END, 
  created_at ASC;
```
Notice:
* **Token #87** (Ramprasad Sharma, 60y) is right at the top as **`IMMEDIATE`**.
* **Token #62** (Kamla Devi, 62y) is marked **`SOON`** with `is_fail_safe_escalation = true` (unrecorded vitals safety escalation).
* **Token #23** (Priya Verma, 24y) sits safely in **`ROUTINE`**.

### D. Check the Immutable Audit Trail in PostgreSQL
Run:
```sql
SELECT audit_sequence, token_number, patient_name, event_type, new_priority, staff_badge 
FROM audit_logs 
ORDER BY audit_sequence ASC;
```

---

## 3. Checking Live Application & Database Logs

### A. View Real-Time Application Logs (Next.js)
```bash
docker logs -f triage_app_service
```

### B. View Real-Time Database Logs (PostgreSQL 18)
```bash
docker logs -f triage_postgres
```

### C. Inspect the Append-Only Write-Ahead Log (WAL) File
The system maintains dual durability. You can view the raw WAL file on your host machine:
```bash
cat data/opd_wal.jsonl | head -n 5
```

---

## 4. End-to-End Browser Walkthrough (How to Showcase to Mentors)

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

### Step 1: Open the Live Queue (`/dashboard`)
* You will see the live sorted doctor queue.
* Point out that **Token 87** jumped to the top over earlier routine patients because of acute chest tightness.

### Step 2: Register a New Patient (`/register`)
* Type:
  * **Patient Name**: `Dev Dhanadiya`
  * **Age**: `50`
  * **Symptoms**: `mild pain in chest`
* Notice that the **Live Triage Box appears only after typing** with calculated result **`IMMEDIATE`** and rationale.
* Click **"Issue Token & Push to Doctor Queue"**.
* Click the green banner button: **"View in Queue →"**.
* The screen immediately navigates to `/dashboard` and **smoothly auto-scrolls directly to Dev's card with an active blue highlight ring**!

### Step 3: Trigger a 1-Tap Nurse Clinical Override
* On any routine patient card (e.g. Token #23), click **"Override Priority"**.
* Select **`IMMEDIATE`**.
* Enter reason: *"Patient observed diaphoretic and clammy in hallway"*.
* Click **Confirm Clinical Override**.
* The patient immediately jumps to Rank #1 with an amber **OVERRIDDEN** badge.

### Step 4: Verify the Audit Trail (`/audit`)
* Click the **Audit Log** tab.
* See the immutable record with sequence number, nurse badge, timestamp, and explanation.

---

## 5. Running Automated Test Suites

Run the 20-test automated verification suite anytime:
```bash
npm test
```
Or run the clinical end-to-end simulation:
```bash
npm run verify
```
