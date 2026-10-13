/**
 * In-memory thread-safe singleton state store with Write-Ahead Log (WAL) durability.
 * Developed for Dr. S.N. Medical College, Jodhpur (Aayu 2026 Hackathon Track 01).
 *
 * Persistence Model:
 * 1. Synchronous WAL writes: Every change is committed to data/opd_wal.jsonl immediately.
 * 2. Instant in-memory reads: Serves real-time queries with zero disk latency.
 * 3. Crash Recovery: Automatically replays WAL transactions on system boot.
 */

import {
  AuditEntry,
  DEFAULT_STAFF_PROFILES,
  Patient,
  PatientStatus,
  PriorityLevel,
  QueueSummary,
  StaffProfile,
  TriageInput,
} from '@/types/triage';
import { evaluateTriage } from './triage';
import { walStorage, WalRecord } from './wal';

export { DEFAULT_STAFF_PROFILES };

const PRIORITY_RANK: Record<PriorityLevel, number> = {
  IMMEDIATE: 1,
  SOON: 2,
  ROUTINE: 3,
};

interface SeedPatientConfig {
  tokenNumber: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  complaint: string;
  vitals: {
    systolicBp?: number;
    diastolicBp?: number;
    pulse?: number;
    spo2?: number;
    temperature?: number;
  };
  minutesAgo: number;
  staffBadge: string;
}

const RICH_SEED_PATIENTS: SeedPatientConfig[] = [
  // 1. Mandatory Test Case 1: Token 87 (Chest Tightness in 60y - IMMEDIATE)
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
  // 2. Critical Hypoxia: Token 102 (SpO2 86% - IMMEDIATE)
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
  // 3. Hypertensive Crisis: Token 114 (SBP 218 - IMMEDIATE)
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
  // 4. Collapse / Trauma: Token 129 (Unconscious - IMMEDIATE)
  {
    tokenNumber: '129',
    name: 'Mohammed Irfan',
    age: 19,
    gender: 'MALE',
    complaint: 'Collapse and unconscious post road traffic fall',
    vitals: { systolicBp: 88, diastolicBp: 54, pulse: 138, spo2: 91, temperature: 97.8 },
    minutesAgo: 2,
    staffBadge: 'SN-402 (Staff Nurse Sunita)',
  },
  // 5. Acute Abdominal Distress: Token 54 (Pet dard - SOON)
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
  // 6. Mandatory Test Case 3: Token 62 (Partial vitals elderly fail-safe - SOON)
  {
    tokenNumber: '62',
    name: 'Kamla Devi',
    age: 62,
    gender: 'FEMALE',
    complaint: 'Chakkar and ghabrahat',
    vitals: {},
    minutesAgo: 16,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  // 7. Active Trauma Bleeding: Token 71 (Hand laceration - SOON)
  {
    tokenNumber: '71',
    name: 'Sunita Gurjar',
    age: 29,
    gender: 'FEMALE',
    complaint: 'Active bleeding from hand laceration post crop machine cut',
    vitals: { systolicBp: 118, diastolicBp: 76, pulse: 104, spo2: 98, temperature: 98.4 },
    minutesAgo: 19,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  // 8. Pediatric High Pyrexia: Token 77 (Temp 102.8°F - SOON)
  {
    tokenNumber: '77',
    name: 'Master Aarav',
    age: 4,
    gender: 'MALE',
    complaint: 'Tez bukhar since midnight, lethargic and not eating',
    vitals: { pulse: 128, spo2: 97, temperature: 102.8 },
    minutesAgo: 21,
    staffBadge: 'SN-402 (Staff Nurse Sunita)',
  },
  // 9. Elderly Vague Systemic: Token 83 (Weakness, missing vitals - SOON)
  {
    tokenNumber: '83',
    name: 'Rameshwar Prasad',
    age: 68,
    gender: 'MALE',
    complaint: 'Severe body weakness and unable to stand',
    vitals: {},
    minutesAgo: 24,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  // 10. Mandatory Test Case 2: Token 23 (Routine Refill - ROUTINE)
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
  // 11. Report Review: Token 31 (Routine follow up - ROUTINE)
  {
    tokenNumber: '31',
    name: 'Dr. Anil Vyas (Retd)',
    age: 70,
    gender: 'MALE',
    complaint: 'Blood report dikhana and regular chronic checkup',
    vitals: { systolicBp: 124, diastolicBp: 80, pulse: 74, spo2: 98, temperature: 98.4 },
    minutesAgo: 32,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  // 12. Dermatology Rash: Token 42 (Routine rash - ROUTINE)
  {
    tokenNumber: '42',
    name: 'Manju Choudhary',
    age: 38,
    gender: 'FEMALE',
    complaint: 'Khujli and mild rash on both hands for 1 week',
    vitals: { pulse: 76, spo2: 98, temperature: 98.2 },
    minutesAgo: 29,
    staffBadge: 'DA-014 (Desk Assistant Ramesh)',
  },
  // 13. Suture Removal: Token 91 (Routine procedure - ROUTINE)
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
  // 14. Antenatal Refill: Token 95 (Routine vitamins - ROUTINE)
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

class OPDStore {
  private patients: Map<string, Patient> = new Map();
  private auditLogs: AuditEntry[] = [];
  private sequenceCounter: number = 100;
  private tokenIndexCounter: number = 135;

  constructor() {
    this.initializeFromWalOrSeed();
  }

  private initializeFromWalOrSeed(): void {
    const { records, hasExistingData } = walStorage.replayLog();

    if (hasExistingData && records.length > 0) {
      this.replayWalRecords(records);
    } else {
      this.seedInitialData();
    }
  }

  private replayWalRecords(records: WalRecord[]): void {
    this.patients.clear();
    this.auditLogs = [];

    for (const rec of records) {
      this.sequenceCounter = Math.max(this.sequenceCounter, rec.seq);

      if (rec.action === 'TOKEN_ISSUED') {
        const p = rec.payload as unknown as Patient;
        this.patients.set(rec.patientId, p);
        this.auditLogs.unshift({
          id: `audit-${rec.timestamp}-${rec.seq}`,
          auditSequence: rec.seq,
          timestamp: rec.timestamp,
          tokenNumber: rec.tokenNumber,
          patientId: rec.patientId,
          patientName: p.patientName,
          eventType: 'TOKEN_ISSUED',
          newPriority: p.currentPriority,
          justification: p.clinicalRationale,
          staffBadge: rec.staffBadge,
        });
      } else if (rec.action === 'CLINICAL_OVERRIDE') {
        const payload = rec.payload as {
          oldPriority: PriorityLevel;
          newPriority: PriorityLevel;
          justification: string;
        };
        const p = this.patients.get(rec.patientId);
        if (p) {
          p.currentPriority = payload.newPriority;
          p.isOverridden = true;
          p.overrideJustification = payload.justification;
          p.overriddenBy = rec.staffBadge;
          p.overriddenAt = rec.timestamp;
          p.updatedAt = rec.timestamp;

          this.auditLogs.unshift({
            id: `audit-${rec.timestamp}-${rec.seq}`,
            auditSequence: rec.seq,
            timestamp: rec.timestamp,
            tokenNumber: rec.tokenNumber,
            patientId: rec.patientId,
            patientName: p.patientName,
            eventType: 'CLINICAL_OVERRIDE',
            oldPriority: payload.oldPriority,
            newPriority: payload.newPriority,
            justification: payload.justification,
            staffBadge: rec.staffBadge,
          });
        }
      } else if (rec.action === 'STATUS_CHANGED') {
        const payload = rec.payload as { status: PatientStatus };
        const p = this.patients.get(rec.patientId);
        if (p) {
          p.status = payload.status;
          p.updatedAt = rec.timestamp;
          this.auditLogs.unshift({
            id: `audit-${rec.timestamp}-${rec.seq}`,
            auditSequence: rec.seq,
            timestamp: rec.timestamp,
            tokenNumber: rec.tokenNumber,
            patientId: rec.patientId,
            patientName: p.patientName,
            eventType: 'STATUS_CHANGE',
            newPriority: p.currentPriority,
            justification: `Status updated to ${payload.status}`,
            staffBadge: rec.staffBadge,
          });
        }
      }
    }
  }

  public seedInitialData(): void {
    walStorage.truncateLog();
    this.patients.clear();
    this.auditLogs = [];
    this.sequenceCounter = 100;
    this.tokenIndexCounter = 135;

    const baseTime = Date.now();

    for (const seed of RICH_SEED_PATIENTS) {
      const arrivedTime = new Date(baseTime - seed.minutesAgo * 60 * 1000).toISOString();
      const input: TriageInput = {
        patientName: seed.name,
        age: seed.age,
        gender: seed.gender,
        chiefComplaint: seed.complaint,
        vitals: seed.vitals,
      };

      const triage = evaluateTriage(input, arrivedTime);
      const patient: Patient = {
        id: `pat-${seed.tokenNumber}`,
        tokenNumber: seed.tokenNumber,
        ...input,
        systemPriority: triage.priority,
        currentPriority: triage.priority,
        clinicalRationale: triage.clinicalRationale,
        matchedRules: triage.matchedRules,
        isFailSafeEscalation: triage.isFailSafeEscalation,
        isOverridden: false,
        status: 'WAITING',
        createdAt: arrivedTime,
        updatedAt: arrivedTime,
      };

      this.patients.set(patient.id, patient);

      walStorage.appendRecord(
        'TOKEN_ISSUED',
        patient.id,
        patient.tokenNumber,
        patient as unknown as Record<string, unknown>,
        seed.staffBadge
      );

      this.recordAuditEntry({
        tokenNumber: patient.tokenNumber,
        patientId: patient.id,
        patientName: patient.patientName,
        eventType: 'TOKEN_ISSUED',
        newPriority: patient.currentPriority,
        justification: patient.clinicalRationale,
        staffBadge: seed.staffBadge,
        timestamp: arrivedTime,
      });
    }
  }

  public getPatients(filterStatus?: PatientStatus): Patient[] {
    const list = Array.from(this.patients.values());
    const filtered = filterStatus ? list.filter((p) => p.status === filterStatus) : list;

    return filtered.sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.currentPriority] - PRIORITY_RANK[b.currentPriority];
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.get(id);
  }

  public createPatient(
    input: TriageInput,
    staffBadge: string,
    explicitToken?: string
  ): Patient {
    const token = explicitToken || String(++this.tokenIndexCounter);
    const now = new Date().toISOString();
    const triage = evaluateTriage(input, now);

    const patient: Patient = {
      id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tokenNumber: token,
      ...input,
      systemPriority: triage.priority,
      currentPriority: triage.priority,
      clinicalRationale: triage.clinicalRationale,
      matchedRules: triage.matchedRules,
      isFailSafeEscalation: triage.isFailSafeEscalation,
      isOverridden: false,
      status: 'WAITING',
      createdAt: now,
      updatedAt: now,
    };

    walStorage.appendRecord(
      'TOKEN_ISSUED',
      patient.id,
      patient.tokenNumber,
      patient as unknown as Record<string, unknown>,
      staffBadge
    );

    this.patients.set(patient.id, patient);

    this.recordAuditEntry({
      tokenNumber: patient.tokenNumber,
      patientId: patient.id,
      patientName: patient.patientName,
      eventType: 'TOKEN_ISSUED',
      newPriority: patient.currentPriority,
      justification: patient.clinicalRationale,
      staffBadge,
      timestamp: now,
    });

    return patient;
  }

  public overridePriority(
    patientId: string,
    newPriority: PriorityLevel,
    justification: string,
    staffBadge: string
  ): Patient {
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient with ID "${patientId}" not found.`);
    }

    const trimmedJustification = justification.trim();
    if (trimmedJustification.length < 5) {
      throw new Error('Mandatory clinical override justification must be at least 5 characters.');
    }

    const oldPriority = patient.currentPriority;
    const now = new Date().toISOString();

    walStorage.appendRecord(
      'CLINICAL_OVERRIDE',
      patient.id,
      patient.tokenNumber,
      {
        oldPriority,
        newPriority,
        justification: trimmedJustification,
      },
      staffBadge
    );

    patient.currentPriority = newPriority;
    patient.isOverridden = true;
    patient.overrideJustification = trimmedJustification;
    patient.overriddenBy = staffBadge;
    patient.overriddenAt = now;
    patient.updatedAt = now;

    this.patients.set(patientId, patient);

    this.recordAuditEntry({
      tokenNumber: patient.tokenNumber,
      patientId: patient.id,
      patientName: patient.patientName,
      eventType: 'CLINICAL_OVERRIDE',
      oldPriority,
      newPriority,
      justification: trimmedJustification,
      staffBadge,
      timestamp: now,
    });

    return patient;
  }

  public updateStatus(patientId: string, status: PatientStatus, staffBadge: string): Patient {
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient with ID "${patientId}" not found.`);
    }

    const now = new Date().toISOString();

    walStorage.appendRecord(
      'STATUS_CHANGED',
      patient.id,
      patient.tokenNumber,
      { status },
      staffBadge
    );

    patient.status = status;
    patient.updatedAt = now;

    this.recordAuditEntry({
      tokenNumber: patient.tokenNumber,
      patientId: patient.id,
      patientName: patient.patientName,
      eventType: 'STATUS_CHANGE',
      newPriority: patient.currentPriority,
      justification: `Status updated to ${status}`,
      staffBadge,
      timestamp: now,
    });

    return patient;
  }

  public getAuditLogs(filterOverridesOnly: boolean = false): AuditEntry[] {
    const logs = [...this.auditLogs];
    const filtered = filterOverridesOnly
      ? logs.filter((log) => log.eventType === 'CLINICAL_OVERRIDE')
      : logs;

    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getQueueSummary(): QueueSummary {
    const all = Array.from(this.patients.values());
    const waiting = all.filter((p) => p.status === 'WAITING');

    const now = Date.now();
    let totalWaitMs = 0;
    waiting.forEach((p) => {
      totalWaitMs += Math.max(0, now - new Date(p.createdAt).getTime());
    });

    const averageWaitMinutes =
      waiting.length > 0 ? Math.round(totalWaitMs / (waiting.length * 60 * 1000)) : 0;

    return {
      totalWaiting: waiting.length,
      immediateCount: waiting.filter((p) => p.currentPriority === 'IMMEDIATE').length,
      soonCount: waiting.filter((p) => p.currentPriority === 'SOON').length,
      routineCount: waiting.filter((p) => p.currentPriority === 'ROUTINE').length,
      inConsultationCount: all.filter((p) => p.status === 'IN_CONSULTATION').length,
      completedCount: all.filter((p) => p.status === 'COMPLETED').length,
      overriddenCount: all.filter((p) => p.isOverridden).length,
      averageWaitMinutes,
    };
  }

  private recordAuditEntry(entry: Omit<AuditEntry, 'id' | 'auditSequence'>): void {
    const sequence = ++this.sequenceCounter;
    const fullEntry: AuditEntry = {
      id: `audit-${Date.now()}-${sequence}`,
      auditSequence: sequence,
      ...entry,
    };
    this.auditLogs.unshift(fullEntry);
  }
}

const globalForStore = globalThis as unknown as { opdStore?: OPDStore };

export const opdStore: OPDStore = globalForStore.opdStore ?? new OPDStore();

if (process.env.NODE_ENV !== 'production') {
  globalForStore.opdStore = opdStore;
}
