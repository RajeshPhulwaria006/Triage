/**
 * Core clinical types and interfaces for OPD Flow.
 * Adheres strictly to TypeScript strict mode with zero 'any' types.
 */

export type PriorityLevel = 'IMMEDIATE' | 'SOON' | 'ROUTINE';

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';

export type PatientStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';

export type AuditEventType = 'TOKEN_ISSUED' | 'CLINICAL_OVERRIDE' | 'STATUS_CHANGE';

export interface Vitals {
  systolicBp?: number; // mmHg
  diastolicBp?: number; // mmHg
  pulse?: number; // beats per minute
  spo2?: number; // percentage (0-100)
  temperature?: number; // Fahrenheit
}

export interface TriageInput {
  patientName: string;
  age: number;
  gender: PatientGender;
  chiefComplaint: string;
  vitals: Vitals;
}

export interface TriageResult {
  priority: PriorityLevel;
  clinicalRationale: string;
  matchedRules: string[];
  isFailSafeEscalation: boolean;
  evaluatedAt: string;
}

export interface Patient {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  gender: PatientGender;
  chiefComplaint: string;
  vitals: Vitals;
  systemPriority: PriorityLevel;
  currentPriority: PriorityLevel;
  clinicalRationale: string;
  matchedRules: string[];
  isFailSafeEscalation: boolean;
  isOverridden: boolean;
  overrideJustification?: string;
  overriddenBy?: string;
  overriddenAt?: string;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  eventType: AuditEventType;
  oldPriority?: PriorityLevel;
  newPriority: PriorityLevel;
  justification: string; // System rationale or Nurse override reason
  staffBadge: string;
  auditSequence: number;
}

export interface QueueSummary {
  totalWaiting: number;
  immediateCount: number;
  soonCount: number;
  routineCount: number;
  inConsultationCount: number;
  completedCount: number;
  overriddenCount: number;
  averageWaitMinutes: number;
}

export interface StaffProfile {
  id: string;
  name: string;
  role: string;
  badgeNumber: string;
  department: string;
}

export const DEFAULT_STAFF_PROFILES: StaffProfile[] = [
  {
    id: 'staff-1',
    name: 'Staff Nurse Sunita Sharma',
    role: 'Staff Nurse (Triage Desk 1)',
    badgeNumber: 'SN-402',
    department: 'Emergency & Acute OPD',
  },
  {
    id: 'staff-2',
    name: 'Triage Officer Dr. R.K. Mathur',
    role: 'Triage Medical Officer',
    badgeNumber: 'TO-108',
    department: 'Central Triage Wing',
  },
  {
    id: 'staff-3',
    name: 'Desk Assistant Ramesh Kumar',
    role: 'Registration Executive',
    badgeNumber: 'DA-014',
    department: 'OPD Counter 2',
  },
  {
    id: 'staff-4',
    name: 'Senior Resident Dr. Sneha Vyas',
    role: 'OPD Doctor On-Duty',
    badgeNumber: 'SR-210',
    department: 'Internal Medicine OPD Room 12',
  },
];
