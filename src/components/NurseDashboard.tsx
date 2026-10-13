'use client';

import React, { useState } from 'react';
import { Patient, PriorityLevel, QueueSummary, StaffProfile } from '@/types/triage';
import { OverrideModal } from './OverrideModal';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Stethoscope,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Check,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

interface NurseDashboardProps {
  patients: Patient[];
  summary: QueueSummary;
  activeStaff: StaffProfile;
  onCommitOverride: (
    patientId: string,
    newPriority: PriorityLevel,
    justification: string
  ) => Promise<void>;
  onUpdateStatus: (patientId: string, status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED') => Promise<void>;
  onNavigateToRegister: () => void;
}

export const NurseDashboard: React.FC<NurseDashboardProps> = ({
  patients,
  summary,
  activeStaff,
  onCommitOverride,
  onUpdateStatus,
  onNavigateToRegister,
}) => {
  const [selectedPatientForOverride, setSelectedPatientForOverride] = useState<Patient | null>(
    null
  );
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'IN_CONSULTATION' | 'COMPLETED' | 'ALL'>('ACTIVE');

  const displayedPatients = patients.filter((p) => {
    if (priorityFilter !== 'ALL' && p.currentPriority !== priorityFilter) {
      return false;
    }
    if (statusFilter === 'ACTIVE' && p.status !== 'WAITING') {
      return false;
    }
    if (statusFilter === 'IN_CONSULTATION' && p.status !== 'IN_CONSULTATION') {
      return false;
    }
    if (statusFilter === 'COMPLETED' && p.status !== 'COMPLETED') {
      return false;
    }
    return true;
  });

  const formatWaitTime = (createdAt: string) => {
    const elapsedMinutes = Math.max(
      0,
      Math.floor((Date.now() - new Date(createdAt).getTime()) / (60 * 1000))
    );
    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes === 1) return '1 min ago';
    return `${elapsedMinutes} mins ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Clinical Acuity & Queue Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Waiting */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Total Waiting</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.totalWaiting}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Avg wait: {summary.averageWaitMinutes}m
          </div>
        </div>

        {/* Immediate (Red) */}
        <div
          onClick={() => setPriorityFilter(priorityFilter === 'IMMEDIATE' ? 'ALL' : 'IMMEDIATE')}
          className={`border rounded-xl p-3.5 shadow-xs cursor-pointer transition ${
            priorityFilter === 'IMMEDIATE'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/40'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1 font-bold">
            <span>IMMEDIATE</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-urgent-pulse" />
          </div>
          <div className="text-2xl font-bold text-rose-700 flex items-center gap-2">
            <span>{summary.immediateCount}</span>
            {summary.immediateCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
            )}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">Tier 1 • Urgent Doctor</div>
        </div>

        {/* Soon (Yellow) */}
        <div
          onClick={() => setPriorityFilter(priorityFilter === 'SOON' ? 'ALL' : 'SOON')}
          className={`border rounded-xl p-3.5 shadow-xs cursor-pointer transition ${
            priorityFilter === 'SOON'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs mb-1 font-bold">
            <span>SOON</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{summary.soonCount}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">Tier 2 • Review &lt;30m</div>
        </div>

        {/* Routine (Green) */}
        <div
          onClick={() => setPriorityFilter(priorityFilter === 'ROUTINE' ? 'ALL' : 'ROUTINE')}
          className={`border rounded-xl p-3.5 shadow-xs cursor-pointer transition ${
            priorityFilter === 'ROUTINE'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs mb-1 font-bold">
            <span>ROUTINE</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{summary.routineCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Tier 3 • Standard Flow</div>
        </div>

        {/* In Consultation */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'IN_CONSULTATION' ? 'ACTIVE' : 'IN_CONSULTATION')}
          className={`border rounded-xl p-3.5 shadow-xs cursor-pointer transition ${
            statusFilter === 'IN_CONSULTATION'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/40'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-700 text-xs mb-1 font-bold">
            <span>In Room</span>
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-800">{summary.inConsultationCount}</div>
          <div className="text-[11px] text-blue-600 mt-1 font-medium">Active with Doctor</div>
        </div>

        {/* Overrides Logged */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 text-xs mb-1 font-bold">
            <span>Overrides</span>
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800">{summary.overriddenCount}</div>
          <div className="text-[11px] text-purple-600 mt-1 font-medium">Nurse Discretion Log</div>
        </div>
      </div>

      {/* Control Bar: View toggles & Sort status */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-semibold">Filter Acuity:</span>
          <div className="flex items-center gap-1">
            {(['ALL', 'IMMEDIATE', 'SOON', 'ROUTINE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPriorityFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                  priorityFilter === filter
                    ? filter === 'IMMEDIATE'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : filter === 'SOON'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : filter === 'ROUTINE'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Sorted by: </span>
            <strong className="text-slate-900 font-mono">Triage Severity &rarr; Arrival Time</strong>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Waiting
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Statuses
            </button>
          </div>
        </div>
      </div>

      {/* Patient Queue Cards List */}
      <div className="space-y-3">
        {displayedPatients.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Patients in Selected View</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No patients match your current priority or status filter. Register a new patient or
              reset default test seeds.
            </p>
            <button
              onClick={onNavigateToRegister}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              Register New Patient &rarr;
            </button>
          </div>
        ) : (
          displayedPatients.map((patient, index) => {
            const isImmediate = patient.currentPriority === 'IMMEDIATE';
            const isSoon = patient.currentPriority === 'SOON';
            const isRoutine = patient.currentPriority === 'ROUTINE';

            return (
              <div
                key={patient.id}
                className={`bg-white rounded-xl border transition-all duration-200 shadow-xs ${
                  isImmediate
                    ? 'border-l-4 border-l-rose-600 border-slate-200 ring-1 ring-rose-200'
                    : isSoon
                    ? 'border-l-4 border-l-amber-500 border-slate-200'
                    : 'border-l-4 border-l-emerald-500 border-slate-200'
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Token, Priority Badge & Demographics */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Token Number Box */}
                    <div
                      className={`h-16 w-16 sm:h-20 sm:w-20 rounded-xl flex flex-col items-center justify-center shrink-0 border font-mono ${
                        isImmediate
                          ? 'bg-rose-50 border-rose-300 text-rose-700 animate-urgent-pulse'
                          : isSoon
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-500">Token</span>
                      <span className="text-2xl sm:text-3xl font-black">#{patient.tokenNumber}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Pos #{index + 1}</span>
                    </div>

                    {/* Patient Core Details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                          {patient.patientName}
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">
                          ({patient.age}y • {patient.gender})
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                            isImmediate
                              ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                              : isSoon
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isImmediate && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                          {isSoon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          {isRoutine && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{patient.currentPriority}</span>
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                            patient.status === 'WAITING'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : patient.status === 'IN_CONSULTATION'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {patient.status.replace('_', ' ')}
                        </span>

                        {patient.isOverridden && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-purple-600" />
                            Nurse Overridden
                          </span>
                        )}
                      </div>

                      {/* Chief Complaint */}
                      <div className="text-xs text-slate-700 flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Complaint:</span>
                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {patient.chiefComplaint}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1">
                          • Arrived: {formatWaitTime(patient.createdAt)}
                        </span>
                      </div>

                      {/* Clinical Triage Rationale String */}
                      <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          <span>System Clinical Rationale:</span>
                        </div>
                        <p className="text-slate-800 font-medium">{patient.clinicalRationale}</p>
                      </div>

                      {/* Overridden Callout if applicable */}
                      {patient.isOverridden && (
                        <div className="text-xs bg-purple-50 border border-purple-200 p-2 rounded-lg text-purple-900 space-y-0.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-purple-800">
                            <span>Clinical Override Note:</span>
                            <span className="font-mono text-[10px] text-purple-700">
                              By {patient.overriddenBy}
                            </span>
                          </div>
                          <p className="italic">
                            &quot;{patient.overrideJustification}&quot; (Altered from{' '}
                            {patient.systemPriority} to {patient.currentPriority})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Vitals Grid & Quick Action Buttons */}
                  <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3 shrink-0">
                    {/* Vitals Grid */}
                    <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50 p-2 rounded-lg border border-slate-200 w-full sm:w-auto">
                      {/* BP */}
                      <div className="p-1 rounded bg-white border border-slate-200 min-w-16">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">BP</span>
                        {patient.vitals.systolicBp ? (
                          <span
                            className={`text-xs font-bold font-mono ${
                              patient.vitals.systolicBp > 180
                                ? 'text-rose-600'
                                : patient.vitals.systolicBp > 140
                                ? 'text-amber-700'
                                : 'text-slate-800'
                            }`}
                          >
                            {patient.vitals.systolicBp}/{patient.vitals.diastolicBp || '-'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Not Rec.</span>
                        )}
                      </div>

                      {/* Pulse */}
                      <div className="p-1 rounded bg-white border border-slate-200 min-w-14">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Pulse</span>
                        {patient.vitals.pulse ? (
                          <span
                            className={`text-xs font-bold font-mono ${
                              patient.vitals.pulse > 130 || patient.vitals.pulse < 40
                                ? 'text-rose-600'
                                : patient.vitals.pulse > 105
                                ? 'text-amber-700'
                                : 'text-slate-800'
                            }`}
                          >
                            {patient.vitals.pulse} bpm
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Not Rec.</span>
                        )}
                      </div>

                      {/* SpO2 */}
                      <div className="p-1 rounded bg-white border border-slate-200 min-w-14">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">SpO2</span>
                        {patient.vitals.spo2 ? (
                          <span
                            className={`text-xs font-bold font-mono ${
                              patient.vitals.spo2 < 90
                                ? 'text-rose-600 font-black'
                                : patient.vitals.spo2 <= 94
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {patient.vitals.spo2}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Not Rec.</span>
                        )}
                      </div>

                      {/* Temp */}
                      <div className="p-1 rounded bg-white border border-slate-200 min-w-14">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Temp</span>
                        {patient.vitals.temperature ? (
                          <span
                            className={`text-xs font-bold font-mono ${
                              patient.vitals.temperature >= 101.5
                                ? 'text-amber-700'
                                : 'text-slate-800'
                            }`}
                          >
                            {patient.vitals.temperature}°F
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Not Rec.</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedPatientForOverride(patient)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition shadow-2xs"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                        <span>One-Tap Override</span>
                      </button>

                      {patient.status === 'WAITING' && (
                        <button
                          onClick={() => onUpdateStatus(patient.id, 'IN_CONSULTATION')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call In</span>
                        </button>
                      )}

                      {patient.status === 'IN_CONSULTATION' && (
                        <button
                          onClick={() => onUpdateStatus(patient.id, 'COMPLETED')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Override Modal */}
      {selectedPatientForOverride && (
        <OverrideModal
          patient={selectedPatientForOverride}
          activeStaff={activeStaff}
          isOpen={true}
          onClose={() => setSelectedPatientForOverride(null)}
          onCommitOverride={onCommitOverride}
        />
      )}
    </div>
  );
};
