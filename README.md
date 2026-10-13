# Triage — Smart OPD Patient Prioritisation

Triage is a clinical decision-support prototype that helps busy Outpatient Departments (OPDs) prioritise patients by urgency instead of relying only on first-in, first-out tokens. It uses **deterministic, explainable rules** to assign a priority and show the rationale—without attempting to diagnose a disease.

## Key Features

- **Three-level queue:** `IMMEDIATE`, `SOON`, and `ROUTINE`, ordered by clinical priority and then arrival time.
- **Explainable triage:** Displays matched rules and a rationale for each priority.
- **Fail-safe escalation:** Handles critical observations and missing vital signs conservatively.
- **Nurse override:** Staff can change priority with a mandatory clinical justification.
- **Live dashboard:** Registration, nursing queue, consultation status, and audit views refresh automatically.
- **Audit trail:** Records registrations, status changes, and overrides; supports CSV export.
- **Persistence options:** PostgreSQL when `DATABASE_URL` is configured, with local write-ahead-log (WAL) storage as a fallback.

## Tech Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4, Lucide React
- PostgreSQL (`postgres.js`) with local JSON Lines WAL fallback

## Run Locally

**Requirements:** Node.js and npm. PostgreSQL is optional for local/demo use.

```bash
git clone https://github.com/RajeshPhulwaria006/Triage.git
cd Triage
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To use PostgreSQL, set `DATABASE_URL` in your environment to a valid PostgreSQL connection string. The app can use local WAL storage when this variable is not configured.

## Useful Commands

```bash
npm run build       # Build for production
npm run start       # Start the production server
npm run lint        # Run ESLint
npm run test:triage # Run triage rule tests
npm run test        # Run comprehensive tests
npm run verify      # Run end-to-end verification
npm run seed:db     # Seed the database
```

## Workflow

1. Staff register a patient and enter the chief complaint and available vital signs.
2. The rules engine evaluates the input and assigns a priority with a human-readable rationale.
3. The patient appears in the severity-sorted queue.
4. Clinical staff can update consultation status or override priority with a documented reason.
5. Events are recorded in the audit trail for review.

## Safety Notice

Triage is a **demonstration and decision-support prototype**, not a diagnostic tool or a substitute for trained clinical judgement, emergency protocols, or validated hospital systems. Clinical rules must be reviewed and validated by qualified healthcare professionals before any real-world use.
