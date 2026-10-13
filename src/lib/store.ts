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
  Patient,
  PatientStatus,
  PriorityLevel,
  QueueSummary,
  StaffProfile,
  TriageInput,
} from '@/types/triage';
import { evaluateTriage } from './triage';
import { walStorage, WalRecord } from './wal';

export const DEFAULT_STAFF_PROFILES: StaffProfile[] = [
  {
    id: 'staff-1',
    name: 'Staff Nurse Sunita Sharma',
    role: 'Staff Nurse (Triage Station 1)',
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

const PRIORITY_RANK: Record<PriorityLevel, number> = {
  IMMEDIATE: 1,
  SOON: 2,
  ROUTINE: 3,
};

class OPDStore {
  private patients: Map<string, Patient> = new Map();
  private auditLogs: AuditEntry[] = [];
  private sequenceCounter: number = 100;
  private tokenIndexCounter: number = 92;

  constructor() {
    this.initializeFromWalOrSeed();
  }

  /**
   * Initializes the store by replaying the Write-Ahead Log if present;
   * otherwise seeds standard demonstration cases.
   */
  private initializeFromWalOrSeed(): void {
    const { records, hasExistingData } = walStorage.replayLog();

    if (hasExistingData && records.length > 0) {
      this.replayWalRecords(records);
    } else {
      this.seedInitialData();
    }
  }

  /**
   * Replays WAL records in chronological sequence to reconstruct exact state.
   */
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

  /**
   * Seeds realistic clinical cases and commits them to the WAL log.
   */
  public seedInitialData(): void {
    walStorage.truncateLog();
    this.patients.clear();
    this.auditLogs = [];
    this.sequenceCounter = 100;
    this.tokenIndexCounter = 92;

    const baseTime = Date.now();

    // 1. Token 23: Routine thyroid refill (arrived 15m ago)
    const t23Time = new Date(baseTime - 15 * 60 * 1000).toISOString();
    const p23Input: TriageInput = {
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
    };
    const p23Triage = evaluateTriage(p23Input);
    const p23: Patient = {
      id: 'pat-23',
      tokenNumber: '23',
      ...p23Input,
      systemPriority: p23Triage.priority,
      currentPriority: p23Triage.priority,
      clinicalRationale: p23Triage.clinicalRationale,
      matchedRules: p23Triage.matchedRules,
      isFailSafeEscalation: p23Triage.isFailSafeEscalation,
      isOverridden: false,
      status: 'WAITING',
      createdAt: t23Time,
      updatedAt: t23Time,
    };
    this.patients.set(p23.id, p23);
    walStorage.appendRecord(
      'TOKEN_ISSUED',
      p23.id,
      p23.tokenNumber,
      p23 as unknown as Record<string, unknown>,
      'DA-014 (Desk Assistant Ramesh)'
    );
    this.recordAuditEntry({
      tokenNumber: '23',
      patientId: p23.id,
      patientName: p23.patientName,
      eventType: 'TOKEN_ISSUED',
      newPriority: p23.currentPriority,
      justification: p23.clinicalRationale,
      staffBadge: 'DA-014 (Desk Assistant Ramesh)',
      timestamp: t23Time,
    });

    // 2. Token 54: Pet dard / abdominal distress (arrived 10m ago)
    const t54Time = new Date(baseTime - 10 * 60 * 1000).toISOString();
    const p54Input: TriageInput = {
      patientName: 'Rajesh Bishnoi',
      age: 45,
      gender: 'MALE',
      chiefComplaint: 'Pet dard and vomiting for 2 days',
      vitals: {
        systolicBp: 138,
        diastolicBp: 88,
        pulse: 108,
        spo2: 97,
        temperature: 100.2,
      },
    };
    const p54Triage = evaluateTriage(p54Input);
    const p54: Patient = {
      id: 'pat-54',
      tokenNumber: '54',
      ...p54Input,
      systemPriority: p54Triage.priority,
      currentPriority: p54Triage.priority,
      clinicalRationale: p54Triage.clinicalRationale,
      matchedRules: p54Triage.matchedRules,
      isFailSafeEscalation: p54Triage.isFailSafeEscalation,
      isOverridden: false,
      status: 'WAITING',
      createdAt: t54Time,
      updatedAt: t54Time,
    };
    this.patients.set(p54.id, p54);
    walStorage.appendRecord(
      'TOKEN_ISSUED',
      p54.id,
      p54.tokenNumber,
      p54 as unknown as Record<string, unknown>,
      'SN-402 (Staff Nurse Sunita)'
    );
    this.recordAuditEntry({
      tokenNumber: '54',
      patientId: p54.id,
      patientName: p54.patientName,
      eventType: 'TOKEN_ISSUED',
      newPriority: p54.currentPriority,
      justification: p54.clinicalRationale,
      staffBadge: 'SN-402 (Staff Nurse Sunita)',
      timestamp: t54Time,
    });

    // 3. Token 62: Partial Vitals Case - 62y female with "Chakkar and ghabrahat" (Fail-safe -> SOON)
    const t62Time = new Date(baseTime - 8 * 60 * 1000).toISOString();
    const p62Input: TriageInput = {
      patientName: 'Kamla Devi',
      age: 62,
      gender: 'FEMALE',
      chiefComplaint: 'Chakkar and ghabrahat',
      vitals: {},
    };
    const p62Triage = evaluateTriage(p62Input);
    const p62: Patient = {
      id: 'pat-62',
      tokenNumber: '62',
      ...p62Input,
      systemPriority: p62Triage.priority,
      currentPriority: p62Triage.priority,
      clinicalRationale: p62Triage.clinicalRationale,
      matchedRules: p62Triage.matchedRules,
      isFailSafeEscalation: p62Triage.isFailSafeEscalation,
      isOverridden: false,
      status: 'WAITING',
      createdAt: t62Time,
      updatedAt: t62Time,
    };
    this.patients.set(p62.id, p62);
    walStorage.appendRecord(
      'TOKEN_ISSUED',
      p62.id,
      p62.tokenNumber,
      p62 as unknown as Record<string, unknown>,
      'DA-014 (Desk Assistant Ramesh)'
    );
    this.recordAuditEntry({
      tokenNumber: '62',
      patientId: p62.id,
      patientName: p62.patientName,
      eventType: 'TOKEN_ISSUED',
      newPriority: p62.currentPriority,
      justification: p62.clinicalRationale,
      staffBadge: 'DA-014 (Desk Assistant Ramesh)',
      timestamp: t62Time,
    });

    // 4. Token 87: High-Risk Acute Coronary - arrived 3m ago (IMMEDIATE)
    const t87Time = new Date(baseTime - 3 * 60 * 1000).toISOString();
    const p87Input: TriageInput = {
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
    };
    const p87Triage = evaluateTriage(p87Input);
    const p87: Patient = {
      id: 'pat-87',
      tokenNumber: '87',
      ...p87Input,
      systemPriority: p87Triage.priority,
      currentPriority: p87Triage.priority,
      clinicalRationale: p87Triage.clinicalRationale,
      matchedRules: p87Triage.matchedRules,
      isFailSafeEscalation: p87Triage.isFailSafeEscalation,
      isOverridden: false,
      status: 'WAITING',
      createdAt: t87Time,
      updatedAt: t87Time,
    };
    this.patients.set(p87.id, p87);
    walStorage.appendRecord(
      'TOKEN_ISSUED',
      p87.id,
      p87.tokenNumber,
      p87 as unknown as Record<string, unknown>,
      'TO-108 (Triage Officer Dr. Mathur)'
    );
    this.recordAuditEntry({
      tokenNumber: '87',
      patientId: p87.id,
      patientName: p87.patientName,
      eventType: 'TOKEN_ISSUED',
      newPriority: p87.currentPriority,
      justification: p87.clinicalRationale,
      staffBadge: 'TO-108 (Triage Officer Dr. Mathur)',
      timestamp: t87Time,
    });

    // 5. Token 91: Routine follow up (arrived 1m ago)
    const t91Time = new Date(baseTime - 1 * 60 * 1000).toISOString();
    const p91Input: TriageInput = {
      patientName: 'Manish Soni',
      age: 31,
      gender: 'MALE',
      chiefComplaint: 'Dressing change and stitch removal post-biopsy',
      vitals: {
        pulse: 74,
        spo2: 98,
      },
    };
    const p91Triage = evaluateTriage(p91Input);
    const p91: Patient = {
      id: 'pat-91',
      tokenNumber: '91',
      ...p91Input,
      systemPriority: p91Triage.priority,
      currentPriority: p91Triage.priority,
      clinicalRationale: p91Triage.clinicalRationale,
      matchedRules: p91Triage.matchedRules,
      isFailSafeEscalation: p91Triage.isFailSafeEscalation,
      isOverridden: false,
      status: 'WAITING',
      createdAt: t91Time,
      updatedAt: t91Time,
    };
    this.patients.set(p91.id, p91);
    walStorage.appendRecord(
      'TOKEN_ISSUED',
      p91.id,
      p91.tokenNumber,
      p91 as unknown as Record<string, unknown>,
      'DA-014 (Desk Assistant Ramesh)'
    );
    this.recordAuditEntry({
      tokenNumber: '91',
      patientId: p91.id,
      patientName: p91.patientName,
      eventType: 'TOKEN_ISSUED',
      newPriority: p91.currentPriority,
      justification: p91.clinicalRationale,
      staffBadge: 'DA-014 (Desk Assistant Ramesh)',
      timestamp: t91Time,
    });
  }

  /**
   * Returns patients strictly sorted by triage severity (IMMEDIATE -> SOON -> ROUTINE),
   * then by arrival time (earliest arrival first).
   */
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

  /**
   * Atomically issues a new token, writes to WAL, and updates memory and audit.
   */
  public createPatient(
    input: TriageInput,
    staffBadge: string,
    explicitToken?: string
  ): Patient {
    const token = explicitToken || String(++this.tokenIndexCounter);
    const now = new Date().toISOString();
    const triage = evaluateTriage(input);

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

    // 1. Commit to WAL
    walStorage.appendRecord(
      'TOKEN_ISSUED',
      patient.id,
      patient.tokenNumber,
      patient as unknown as Record<string, unknown>,
      staffBadge
    );

    // 2. Commit to memory
    this.patients.set(patient.id, patient);

    // 3. Record audit
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

  /**
   * One-Tap Clinical Nurse Override.
   * Flushes override transaction to WAL, re-prioritizes patient, and logs audit record.
   */
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

    // 1. Commit to WAL
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

    // 2. Commit to in-memory state
    patient.currentPriority = newPriority;
    patient.isOverridden = true;
    patient.overrideJustification = trimmedJustification;
    patient.overriddenBy = staffBadge;
    patient.overriddenAt = now;
    patient.updatedAt = now;

    this.patients.set(patientId, patient);

    // 3. Record audit
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

  /**
   * Updates patient status (e.g., WAITING -> IN_CONSULTATION -> COMPLETED).
   */
  public updateStatus(patientId: string, status: PatientStatus, staffBadge: string): Patient {
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient with ID "${patientId}" not found.`);
    }

    const now = new Date().toISOString();

    // 1. Commit to WAL
    walStorage.appendRecord(
      'STATUS_CHANGED',
      patient.id,
      patient.tokenNumber,
      { status },
      staffBadge
    );

    // 2. Commit to memory
    patient.status = status;
    patient.updatedAt = now;

    // 3. Record audit
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
