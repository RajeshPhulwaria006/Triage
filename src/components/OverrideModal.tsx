'use client';

import React, { useState } from 'react';
import { Patient, PriorityLevel, StaffProfile } from '@/types/triage';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  ArrowRight,
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
      setErrorMsg('Please provide clinical justification (minimum 5 characters).');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Nurse Priority Override</h2>
            <p className="text-xs text-slate-500">
              Token #{patient.tokenNumber} • {patient.patientName} ({patient.age}y)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Priority Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select New Priority Tier:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPriority('IMMEDIATE')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center ${
                  selectedPriority === 'IMMEDIATE'
                    ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-400/40'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-600 mb-1" />
                <span className="font-bold text-xs">Immediate</span>
                <span className="text-[10px] text-slate-500">Tier 1 • Red</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPriority('SOON')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center ${
                  selectedPriority === 'SOON'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/40'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600 mb-1" />
                <span className="font-bold text-xs">Soon</span>
                <span className="text-[10px] text-slate-500">Tier 2 • Yellow</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPriority('ROUTINE')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center ${
                  selectedPriority === 'ROUTINE'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/40'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-xs">Routine</span>
                <span className="text-[10px] text-slate-500">Tier 3 • Green</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1-Click Clinical Reason Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_JUSTIFICATIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setJustification(preset)}
                  className="text-left text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Justification Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Override Reason *
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State clinical observation..."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Staff Badge Note & Actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 font-mono">
              Staff: {activeStaff.badgeNumber}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Saving...' : 'Apply & Re-Sort Queue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
