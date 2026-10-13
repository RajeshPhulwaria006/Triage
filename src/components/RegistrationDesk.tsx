'use client';

import React, { useState, useMemo } from 'react';
import { PatientGender, StaffProfile, TriageInput, Vitals } from '@/types/triage';
import { evaluateTriage } from '@/lib/triage';
import { Check, Send } from 'lucide-react';

interface RegistrationDeskProps {
  activeStaff: StaffProfile;
  onPatientIssued: () => void;
  onNavigateToDashboard: (tokenNumber?: string) => void;
}

interface PreSeedTestCase {
  label: string;
  badge: 'IMMEDIATE' | 'SOON' | 'ROUTINE';
  tokenCandidate?: string;
  patientName: string;
  age: number;
  gender: PatientGender;
  chiefComplaint: string;
  vitals: Vitals;
}

const QUICK_TEST_CASES: PreSeedTestCase[] = [
  {
    label: 'Token 87 (Chest Pain, 60y)',
    badge: 'IMMEDIATE',
    tokenCandidate: '87',
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
  {
    label: 'Token 23 (Refill, 24y)',
    badge: 'ROUTINE',
    tokenCandidate: '23',
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
  {
    label: 'Token 62 (Dizziness, Unrecorded)',
    badge: 'SOON',
    tokenCandidate: '62',
    patientName: 'Kamla Devi',
    age: 62,
    gender: 'FEMALE',
    chiefComplaint: 'Chakkar and ghabrahat',
    vitals: {},
  },
  {
    label: 'Token 54 (Abdominal Pain, 45y)',
    badge: 'SOON',
    tokenCandidate: '54',
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
  },
];

export const RegistrationDesk: React.FC<RegistrationDeskProps> = ({
  activeStaff,
  onPatientIssued,
  onNavigateToDashboard,
}) => {
  const [patientName, setPatientName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<PatientGender>('MALE');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [tokenOverride, setTokenOverride] = useState<string>('');

  const [systolicBp, setSystolicBp] = useState<string>('');
  const [diastolicBp, setDiastolicBp] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [spo2, setSpo2] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<{
    tokenNumber: string;
    patientName: string;
    priority: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedVitals = useMemo<Vitals>(() => {
    const v: Vitals = {};
    if (systolicBp.trim() !== '') v.systolicBp = Number(systolicBp);
    if (diastolicBp.trim() !== '') v.diastolicBp = Number(diastolicBp);
    if (pulse.trim() !== '') v.pulse = Number(pulse);
    if (spo2.trim() !== '') v.spo2 = Number(spo2);
    if (temperature.trim() !== '') v.temperature = Number(temperature);
    return v;
  }, [systolicBp, diastolicBp, pulse, spo2, temperature]);

  const triageInput = useMemo<TriageInput>(() => {
    const parsedAge = age.trim() !== '' ? Math.max(0, Number(age)) : 30;
    return {
      patientName: patientName || 'Patient',
      age: parsedAge,
      gender,
      chiefComplaint: chiefComplaint || '',
      vitals: parsedVitals,
    };
  }, [patientName, age, gender, chiefComplaint, parsedVitals]);

  const previewTriage = useMemo(() => {
    return evaluateTriage(triageInput, 'preview');
  }, [triageInput]);

  const loadTestCase = (tc: PreSeedTestCase) => {
    setPatientName(tc.patientName);
    setAge(String(tc.age));
    setGender(tc.gender);
    setChiefComplaint(tc.chiefComplaint);
    setTokenOverride(tc.tokenCandidate || '');

    setSystolicBp(tc.vitals.systolicBp !== undefined ? String(tc.vitals.systolicBp) : '');
    setDiastolicBp(tc.vitals.diastolicBp !== undefined ? String(tc.vitals.diastolicBp) : '');
    setPulse(tc.vitals.pulse !== undefined ? String(tc.vitals.pulse) : '');
    setSpo2(tc.vitals.spo2 !== undefined ? String(tc.vitals.spo2) : '');
    setTemperature(tc.vitals.temperature !== undefined ? String(tc.vitals.temperature) : '');

    setSuccessBanner(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPatientName('');
    setAge('');
    setGender('MALE');
    setChiefComplaint('');
    setTokenOverride('');
    setSystolicBp('');
    setDiastolicBp('');
    setPulse('');
    setSpo2('');
    setTemperature('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMessage('Please enter patient name.');
      return;
    }
    if (age.trim() === '' || isNaN(Number(age))) {
      setErrorMessage('Please enter a valid age.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setErrorMessage('Please enter chief complaint / symptoms.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          age: Number(age),
          gender,
          chiefComplaint: chiefComplaint.trim(),
          vitals: parsedVitals,
          staffBadge: `[${activeStaff.badgeNumber}] ${activeStaff.name}`,
          tokenNumber: tokenOverride.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to issue token');
      }

      setSuccessBanner({
        tokenNumber: data.patient.tokenNumber,
        patientName: data.patient.patientName,
        priority: data.patient.currentPriority,
      });

      handleClear();
      onPatientIssued();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error submitting registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Quick Presets */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Quick Fill:
          </span>
          {QUICK_TEST_CASES.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadTestCase(tc)}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium transition flex items-center gap-1.5"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tc.badge === 'IMMEDIATE'
                    ? 'bg-red-600'
                    : tc.badge === 'SOON'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
              />
              <span>{tc.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-slate-700 ml-auto"
        >
          Clear
        </button>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                Token #{successBanner.tokenNumber} Created: {successBanner.patientName}
              </p>
              <p className="text-xs text-emerald-800">
                Assigned Priority: <strong>{successBanner.priority}</strong>. Patient is now in queue.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToDashboard(successBanner.tokenNumber)}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition"
          >
            View in Queue &rarr;
          </button>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name, Age, Gender, Token # */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ramprasad Sharma"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 60"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                aria-label="Patient Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as PatientGender)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Token # (Optional)</label>
                <span className="text-[10px] text-slate-400">Auto if blank</span>
              </div>
              <input
                type="text"
                value={tokenOverride}
                onChange={(e) => setTokenOverride(e.target.value)}
                placeholder="e.g. 105"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Symptoms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Symptoms / Chief Complaint *
            </label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Tightness in chest, severe sweating OR saas lene me dikkat..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Row 3: Vitals */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Vitals (Optional)</span>
              <span className="text-[11px] text-slate-400">
                Auto-escalated if unrecorded
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Systolic BP</label>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  placeholder="e.g. 155"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Diastolic BP</label>
                <input
                  type="number"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value)}
                  placeholder="e.g. 95"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Pulse (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="e.g. 112"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  placeholder="e.g. 93"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] text-slate-500 mb-0.5">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="e.g. 98.4"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Live Result Evaluation - displayed once user enters clinical data */}
          {chiefComplaint.trim().length > 0 && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                previewTriage.priority === 'IMMEDIATE'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : previewTriage.priority === 'SOON'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider">
                    Calculated Triage:
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      previewTriage.priority === 'IMMEDIATE'
                        ? 'bg-red-600 text-white'
                        : previewTriage.priority === 'SOON'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {previewTriage.priority}
                  </span>
                  {previewTriage.isFailSafeEscalation && (
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                      Fail-Safe Escalated
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium">{previewTriage.clinicalRationale}</p>
              </div>

              <div className="text-[11px] font-mono text-slate-600 shrink-0">
                Staff: {activeStaff.badgeNumber}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Issuing...' : 'Issue Token & Push to Doctor Queue'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
