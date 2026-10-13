/**
 * Verification test runner for OPD Flow deterministic triage rules.
 * Runs standalone to validate compliance with all Hackathon track constraints.
 */

import { evaluateTriage } from './triage';
import { TriageInput } from '@/types/triage';

interface TestCase {
  name: string;
  input: TriageInput;
  expectedPriority: 'IMMEDIATE' | 'SOON' | 'ROUTINE';
  expectedRationaleSubstring?: string;
  expectedFailSafe?: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Mandatory Test Case 1: Token 87 (High-Risk Acute Coronary)',
    input: {
      patientName: 'Ramprasad Sharma',
      age: 60,
      gender: 'MALE',
      chiefComplaint: 'Tightness in chest, severe sweating',
      vitals: {
        systolicBp: 155,
        diastolicBp: 95,
        pulse: 112,
        spo2: 93,
        temperature: 98.4,
      },
    },
    expectedPriority: 'IMMEDIATE',
    expectedRationaleSubstring: 'High-Risk Acute Coronary',
    expectedFailSafe: false,
  },
  {
    name: 'Mandatory Test Case 2: Token 23 (Benign Maintenance / Refill)',
    input: {
      patientName: 'Priya Verma',
      age: 24,
      gender: 'FEMALE',
      chiefComplaint: 'Routine thyroid refill follow-up',
      vitals: {
        systolicBp: 118,
        diastolicBp: 76,
        pulse: 72,
        spo2: 99,
        temperature: 98.2,
      },
    },
    expectedPriority: 'ROUTINE',
    expectedRationaleSubstring: 'Clinically stable complaint',
    expectedFailSafe: false,
  },
  {
    name: 'Mandatory Test Case 3: Partial Vitals Case (Elderly with Ghabrahat & Missing Vitals)',
    input: {
      patientName: 'Kamla Devi',
      age: 62,
      gender: 'FEMALE',
      chiefComplaint: 'Chakkar and ghabrahat',
      vitals: {},
    },
    expectedPriority: 'SOON',
    expectedRationaleSubstring: 'Elderly patient (>=55y) with unrecorded vitals',
    expectedFailSafe: true,
  },
  {
    name: 'Critical Hypoxia (SpO2 < 90%)',
    input: {
      patientName: 'Om Prakash',
      age: 50,
      gender: 'MALE',
      chiefComplaint: 'Cough and malaise',
      vitals: {
        spo2: 88,
        pulse: 98,
      },
    },
    expectedPriority: 'IMMEDIATE',
    expectedRationaleSubstring: 'Critical Hypoxia',
  },
  {
    name: 'Severe Hemodynamic Instability (Extreme Tachycardia > 130 bpm)',
    input: {
      patientName: 'Amit Joshi',
      age: 38,
      gender: 'MALE',
      chiefComplaint: 'Palpitations',
      vitals: {
        pulse: 138,
        systolicBp: 120,
      },
    },
    expectedPriority: 'IMMEDIATE',
    expectedRationaleSubstring: 'Severe Hemodynamic Instability',
  },
  {
    name: 'Hypertensive Crisis (Systolic BP > 200 mmHg)',
    input: {
      patientName: 'Gopal Lal',
      age: 58,
      gender: 'MALE',
      chiefComplaint: 'Headache',
      vitals: {
        systolicBp: 210,
        diastolicBp: 115,
        pulse: 88,
      },
    },
    expectedPriority: 'IMMEDIATE',
    expectedRationaleSubstring: 'Hypertensive Crisis',
  },
  {
    name: 'Localized Transliteration ("saas lene me dikkat", age 42)',
    input: {
      patientName: 'Suresh Kumar',
      age: 42,
      gender: 'MALE',
      chiefComplaint: 'chhati me dard aur saas lene me dikkat',
      vitals: {
        pulse: 92,
        spo2: 96,
      },
    },
    expectedPriority: 'IMMEDIATE',
    expectedRationaleSubstring: 'High-Risk Acute Coronary',
  },
  {
    name: 'Unverified Young Adult with Vague Complaint (Age 28, Missing Vitals)',
    input: {
      patientName: 'Vikas Choudhary',
      age: 28,
      gender: 'MALE',
      chiefComplaint: 'Severe weakness and ghabrahat',
      vitals: {},
    },
    expectedPriority: 'SOON',
    expectedRationaleSubstring: 'Unverified hemodynamics with systemic complaint',
    expectedFailSafe: true,
  },
  {
    name: 'Missing Vitals with Explicitly Benign Follow-up',
    input: {
      patientName: 'Sunita Jain',
      age: 32,
      gender: 'FEMALE',
      chiefComplaint: 'Report dikhana and follow up check',
      vitals: {},
    },
    expectedPriority: 'ROUTINE',
    expectedRationaleSubstring: 'Clinically stable complaint',
    expectedFailSafe: false,
  },
  {
    name: 'Acute Abdominal Pain ("pet dard")',
    input: {
      patientName: 'Manish Soni',
      age: 34,
      gender: 'MALE',
      chiefComplaint: 'Tez pet dard since morning',
      vitals: {
        pulse: 88,
        systolicBp: 124,
      },
    },
    expectedPriority: 'SOON',
    expectedRationaleSubstring: 'Acute Distress Symptom',
  },
];

export function runTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  console.log('====================================================');
  console.log('🩺 OPD FLOW: CLINICAL TRIAGE RULES VERIFICATION RUN');
  console.log('====================================================\n');

  for (const tc of testCases) {
    const result = evaluateTriage(tc.input);
    const priorityOk = result.priority === tc.expectedPriority;
    const rationaleOk = tc.expectedRationaleSubstring
      ? result.clinicalRationale.includes(tc.expectedRationaleSubstring)
      : true;
    const failSafeOk =
      tc.expectedFailSafe !== undefined
        ? result.isFailSafeEscalation === tc.expectedFailSafe
        : true;

    if (priorityOk && rationaleOk && failSafeOk) {
      console.log(`✅ PASS: ${tc.name}`);
      console.log(`   Priority: [${result.priority}] | FailSafe: ${result.isFailSafeEscalation}`);
      console.log(`   Rationale: ${result.clinicalRationale}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${tc.name}`);
      console.error(`   Expected: ${tc.expectedPriority}, Got: ${result.priority}`);
      console.error(`   Rationale: ${result.clinicalRationale}`);
      failed++;
    }
    console.log('----------------------------------------------------');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests.`);
  return { passed, failed };
}

// Run immediately if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('triage.test')) {
  const { failed } = runTests();
  if (failed > 0) {
    process.exit(1);
  }
}
