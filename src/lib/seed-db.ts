/**
 * Database Seed Script for Triage.
 *
 * Can be run stand-alone (`npx tsx src/lib/seed-db.ts`) or invoked automatically on server boot.
 * Executes:
 * 1. Schema DDL creation via postgres.js
 * 2. Purges stale test runs if requested
 * 3. Populates 14 comprehensive, realistic clinical patient scenarios
 * 4. Seeds corresponding audit log entries
 */

import { getSql, initializeDatabase, isPostgresConfigured } from './db';
import { evaluateTriage } from './triage';
import { TriageInput } from '@/types/triage';

export const SEED_PATIENTS_DATA = [
  {
    tokenNumber: '87',
    name: 'Ramprasad Sharma',
    age: 60,
    gender: 'MALE',
    complaint: 'Tightness in chest, severe sweating',
    vitals: { systolicBp: 155, diastolicBp: 95, pulse: 112, spo2: 93, temperature: 98.4 },
    minutesAgo: 4,
    staffBadge: 'TO-108 (Triage Officer Dr. Mathur)',
  },
  {
    tokenNumber: '102',
    name: 'Savitri Bai',
    age: 52,
    gender: 'FEMALE',
    complaint: 'chhati me dard aur saas lene me bahut dikkat',
    vitals: { systolicBp: 160, diastolicBp: 98, pulse: 124, spo2: 86, temperature: 99.1 },
    minutesAgo: 6,
    staffBadge: 'SN-402 (Staff Nurse Sunita)',
  },
  {
    tokenNumber: '114',
    name: 'Gopal Lal',
    age: 58,
    gender: 'MALE',
    complaint: 'Severe occipital headache, epistaxis and blurred vision',
    vitals: { systolicBp: 218, diastolicBp: 122, pulse: 92, spo2: 97, temperature: 98.6 },
    minutesAgo: 9,
    staffBadge: 'TO-108 (Triage Officer Dr. Mathur)',
  },
  {
    tokenNumber: '129',
    name: 'Mohammed Irfan',
    age: 19,
    gender: 'MALE',
    complaint: 'Acute collapse following direct cricket ball impact to chest',
    vitals: { systolicBp: 88, diastolicBp: 54, pulse: 136, spo2: 91, temperature: 97.9 },
    minutesAgo: 2,
    staffBadge: 'SN-402 (Staff Nurse Sunita)',
  },
  {
    tokenNumber: '62',
    name: 'Kamla Devi',
    age: 62,
    gender: 'FEMALE',
    complaint: 'Chakkar and ghabrahat',
    vitals: {},
    minutesAgo: 16,
    staffBadge: 'SN-402 (Staff Nurse Sunita)',
  },
  {
    tokenNumber: '54',
    name: 'Rajesh Bishnoi',
    age: 45,
    gender: 'MALE',
    complaint: 'Pet dard and vomiting for 2 days',
    vitals: { systolicBp: 138, diastolicBp: 88, pulse: 108, spo2: 97, temperature: 100.2 },
    minutesAgo: 14,
    staffBadge: 'SN-402 (Staff Nurse Sunita)',
  },
  {
    tokenNumber: '71',
    name: 'Sunita Gurjar',
    age: 29,
    gender: 'FEMALE',
    complaint: 'High grade pyrexia, chills and severe body ache for 3 days',
    vitals: { systolicBp: 110, diastolicBp: 70, pulse: 116, spo2: 96, temperature: 102.8 },
    minutesAgo: 19,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  {
    tokenNumber: '77',
    name: 'Master Aarav',
    age: 4,
    gender: 'MALE',
    complaint: 'Continuous barking stridor cough and respiratory distress',
    vitals: { pulse: 138, spo2: 92, temperature: 101.4 },
    minutesAgo: 21,
    staffBadge: 'SN-402 (Staff Nurse Sunita)',
  },
  {
    tokenNumber: '83',
    name: 'Rameshwar Prasad',
    age: 68,
    gender: 'MALE',
    complaint: 'Severe chronic osteoarthritis knee pain flare-up',
    vitals: { systolicBp: 178, diastolicBp: 102, pulse: 76, spo2: 96, temperature: 98.2 },
    minutesAgo: 24,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  {
    tokenNumber: '23',
    name: 'Priya Verma',
    age: 24,
    gender: 'FEMALE',
    complaint: 'Routine thyroid refill follow-up',
    vitals: { systolicBp: 118, diastolicBp: 76, pulse: 72, spo2: 99, temperature: 98.2 },
    minutesAgo: 38,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  {
    tokenNumber: '31',
    name: 'Dr. Anil Vyas (Retd)',
    age: 70,
    gender: 'MALE',
    complaint: 'Routine follow up for lipid profile review',
    vitals: { systolicBp: 124, diastolicBp: 80, pulse: 68, spo2: 98, temperature: 98.0 },
    minutesAgo: 32,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  {
    tokenNumber: '42',
    name: 'Manju Choudhary',
    age: 38,
    gender: 'FEMALE',
    complaint: 'Mild generalized weakness and seasonal sneezing',
    vitals: { systolicBp: 120, diastolicBp: 78, pulse: 74, spo2: 99, temperature: 98.6 },
    minutesAgo: 29,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  {
    tokenNumber: '91',
    name: 'Manish Soni',
    age: 31,
    gender: 'MALE',
    complaint: 'Dressing change and stitch removal post-biopsy',
    vitals: { pulse: 74, spo2: 98 },
    minutesAgo: 11,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  {
    tokenNumber: '95',
    name: 'Geeta Meena',
    age: 26,
    gender: 'FEMALE',
    complaint: 'Second trimester routine calcium & iron refill',
    vitals: { systolicBp: 112, diastolicBp: 72, pulse: 80, spo2: 99, temperature: 98.4 },
    minutesAgo: 7,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
];

export async function seedPostgresDatabase(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  await initializeDatabase();

  const countResult = await sql`SELECT COUNT(*)::int as count FROM patients`;
  const existingCount = countResult[0]?.count || 0;

  // Only seed if empty or fresh
  if (existingCount > 0) {
    return true;
  }

  const baseTime = Date.now();
  let seq = 100;

  for (const s of SEED_PATIENTS_DATA) {
    seq++;
    const arrivedTime = new Date(baseTime - s.minutesAgo * 60 * 1000).toISOString();
    const input: TriageInput = {
      patientName: s.name,
      age: s.age,
      gender: s.gender as 'MALE' | 'FEMALE' | 'OTHER',
      chiefComplaint: s.complaint,
      vitals: s.vitals,
    };

    const triage = evaluateTriage(input, arrivedTime);
    const patientId = `pat-${s.tokenNumber}`;

    await sql`
      INSERT INTO patients (
        id, token_number, patient_name, age, gender, chief_complaint, vitals,
        system_priority, current_priority, clinical_rationale, matched_rules,
        is_fail_safe_escalation, is_overridden, status, created_at, updated_at
      ) VALUES (
        ${patientId},
        ${s.tokenNumber},
        ${s.name},
        ${s.age},
        ${s.gender},
        ${s.complaint},
        ${JSON.stringify(s.vitals)},
        ${triage.priority},
        ${triage.priority},
        ${triage.clinicalRationale},
        ${JSON.stringify(triage.matchedRules)},
        ${triage.isFailSafeEscalation},
        FALSE,
        'WAITING',
        ${arrivedTime},
        ${arrivedTime}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      INSERT INTO audit_logs (
        id, audit_sequence, timestamp, token_number, patient_id, patient_name,
        event_type, new_priority, justification, staff_badge
      ) VALUES (
        ${`audit-${arrivedTime}-${seq}`},
        ${seq},
        ${arrivedTime},
        ${s.tokenNumber},
        ${patientId},
        ${s.name},
        'TOKEN_ISSUED',
        ${triage.priority},
        ${triage.clinicalRationale},
        ${s.staffBadge}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  return true;
}

// Allow CLI execution: `npx tsx src/lib/seed-db.ts`
if (require.main === module) {
  if (!isPostgresConfigured()) {
    console.log('[Postgres Seed] DATABASE_URL not set. Set DATABASE_URL to seed PostgreSQL.');
    process.exit(0);
  }
  seedPostgresDatabase()
    .then(() => {
      console.log('✅ PostgreSQL schema & seed dataset successfully initialized!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed seeding PostgreSQL:', err);
      process.exit(1);
    });
}
