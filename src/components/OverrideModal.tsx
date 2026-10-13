'use client';

import React, { useState } from 'react';
import { Patient, PriorityLevel, StaffProfile } from '@/types/triage';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface OverrideModalProps {
  patient: Patient;
  activeStaff: StaffProfile;
  isOpen: boolean;
  onClose: () => void;
  onCommitOverride: (
    patientId: string,
    newPriority: PriorityLevel,
    justification: string
  ) => Promise<void>;
}

const PRESET_JUSTIFICATIONS = [
  'Patient observed diaphoretic and pale in corridor',
  'Patient vitals stabilized post-nebulization',
  'Sudden onset altered sensorium witnessed at counter',
  'Severe radiating pain unresponsive to oral analgesia',
  'Clinically comfortable, vital signs repeat normal after rest',
  'Bedside capillary blood glucose critically low (42 mg/dL)',
  'Active uncontrolled bleeding from wound site',
];

export const OverrideModal: React.FC<OverrideModalProps> = ({
  patient,
  activeStaff,
  isOpen,
  onClose,
  onCommitOverride,
}) => {
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>(
    patient.currentPriority === 'IMMEDIATE'
      ? 'SOON'
      : patient.currentPriority === 'SOON'
      ? 'IMMEDIATE'
      : 'SOON'
  );
  const [justification, setJustification] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || justification.trim().length < 5) {
      setErrorMsg('Mandatory clinical override justification must be at least 5 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onCommitOverride(patient.id, selectedPriority, justification.trim());
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to apply clinical override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-xl w-full overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">One-Tap Clinical Nurse Override</h2>
              <p className="text-xs text-slate-500">
                Token #{patient.tokenNumber} • {patient.patientName} ({patient.age}y, {patient.gender})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current State Summary */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Current Assigned Priority:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                  patient.currentPriority === 'IMMEDIATE'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : patient.currentPriority === 'SOON'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {patient.currentPriority}
              </span>
            </div>
            <div className="text-slate-600 font-medium">
              <span className="text-slate-500 font-normal">System Rationale: </span>
              {patient.clinicalRationale}
            </div>
          </div>

          {/* New Priority Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select New Target Priority Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPriority('IMMEDIATE')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition text-center ${
                  selectedPriority === 'IMMEDIATE'
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/40 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 mb-1" />
                <span className="font-bold text-xs">IMMEDIATE</span>
                <span className="text-[10px] text-slate-500">Red • Immediate Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPriority('SOON')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition text-center ${
                  selectedPriority === 'SOON'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Clock className="w-5 h-5 text-amber-600 mb-1" />
                <span className="font-bold text-xs">SOON</span>
                <span className="text-[10px] text-slate-500">Yellow • Bedside Review</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPriority('ROUTINE')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition text-center ${
                  selectedPriority === 'ROUTINE'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="font-bold text-xs">ROUTINE</span>
                <span className="text-[10px] text-slate-500">Green • Standard Queue</span>
              </button>
            </div>
          </div>

          {/* Quick Justification Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                One-Tap Clinical Presets
              </label>
              <span className="text-[11px] text-slate-500">Click to auto-fill</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              {PRESET_JUSTIFICATIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setJustification(preset)}
                  className="text-left text-[11px] bg-white hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 transition font-medium"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Free text clinical justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mandatory Clinical Override Justification *
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State explicit clinical grounds (e.g. Diaphoretic in corridor, SpO2 stabilized post-O2 therapy)..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              required
            />
          </div>

          {/* Attributing Staff Badge Callout */}
          <div className="bg-slate-50 px-3 py-2 rounded-md border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-medium">Attributed Staff Badge:</span>
            <span className="text-blue-700 font-mono font-bold">
              [{activeStaff.badgeNumber}] {activeStaff.name}
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Committing...' : 'Commit Override & Re-Sort Queue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
