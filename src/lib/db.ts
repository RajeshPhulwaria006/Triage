/**
 * PostgreSQL Database Adapter for Triage.
 *
 * Built with `postgres` (postgres.js) - the fastest, zero-dependency PostgreSQL client for Node.js.
 * Features:
 * - Dynamic DDL execution (auto-creates tables and indexes on fresh startup).
 * - Automatic seeding of rich realistic clinical patient scenarios.
 * - Works natively on Docker, Railway, Render, Supabase, Neon, AWS RDS, or local Postgres.
 * - If DATABASE_URL is not set, gracefully falls back to the local WAL storage.
 */

import postgres from 'postgres';
import { Patient, AuditEntry, PriorityLevel, PatientStatus, TriageInput, StaffProfile, DEFAULT_STAFF_PROFILES } from '@/types/triage';

const DATABASE_URL = process.env.DATABASE_URL;

// Reusable connection instance (connection pooling)
let sqlInstance: postgres.Sql | null = null;

export function getSql(): postgres.Sql | null {
  if (!DATABASE_URL) return null;
  if (!sqlInstance) {
    sqlInstance = postgres(DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return sqlInstance;
}

export function isPostgresConfigured(): boolean {
  return Boolean(DATABASE_URL);
}

/**
 * Initializes the PostgreSQL schema and seeds default data if tables are empty.
 */
export async function initializeDatabase(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    // 1. Create Patients Table
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(64) PRIMARY KEY,
        token_number VARCHAR(32) NOT NULL UNIQUE,
        patient_name VARCHAR(255) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(16) NOT NULL,
        chief_complaint TEXT NOT NULL,
        vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
        system_priority VARCHAR(16) NOT NULL,
        current_priority VARCHAR(16) NOT NULL,
        clinical_rationale TEXT NOT NULL,
        matched_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_fail_safe_escalation BOOLEAN NOT NULL DEFAULT FALSE,
        is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
        override_reason TEXT,
        overridden_by VARCHAR(255),
        overridden_at TIMESTAMPTZ,
        status VARCHAR(32) NOT NULL DEFAULT 'WAITING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 2. Create Audit Logs Table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        audit_sequence INT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        token_number VARCHAR(32) NOT NULL,
        patient_id VARCHAR(64) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        old_priority VARCHAR(16),
        new_priority VARCHAR(16) NOT NULL,
        justification TEXT NOT NULL,
        staff_badge VARCHAR(255) NOT NULL
      );
    `;

    // 3. Create Performance Indexes for real-time triage queue lookups
    await sql`CREATE INDEX IF NOT EXISTS idx_patients_status_priority ON patients(status, current_priority);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(timestamp DESC);`;

    return true;
  } catch (err) {
    console.warn('[Postgres] Initialization notice:', err);
    return false;
  }
}
