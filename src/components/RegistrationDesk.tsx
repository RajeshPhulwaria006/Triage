'use client';

import React, { useState, useMemo } from 'react';
import { PatientGender, StaffProfile, TriageInput, Vitals } from '@/types/triage';
import { evaluateTriage } from '@/lib/triage';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Zap,
  Info,
  Activity,
  ShieldCheck,
  User,
  Check,
  Sparkles,
} from 'lucide-react';

interface RegistrationDeskProps {
  activeStaff: StaffProfile;
  onPatientIssued: () => void;
  onNavigateToDashboard: () => void;
}

interface PreSeedTestCase {
  label: string;
  badge: 'IMMEDIATE' | 'SOON' | 'ROUTINE';
  badgeSub?: string;
  tokenCandidate?: string;
  patientName: string;
  age: number;
  gender: PatientGender;
  chiefComplaint: string;
  vitals: Vitals;
}

const QUICK_TEST_CASES: PreSeedTestCase[] = [
  {
    label: 'Test Case 1: Token 87',
    badge: 'IMMEDIATE',
    badgeSub: 'Chest Tightness',
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
    label: 'Test Case 2: Token 23',
    badge: 'ROUTINE',
    badgeSub: 'Routine Refill',
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
    label: 'Test Case 3: Partial Vitals Case',
    badge: 'SOON',
    badgeSub: 'Elderly Fail-Safe',
    tokenCandidate: '62',
    patientName: 'Kamla Devi',
    age: 62,
    gender: 'FEMALE',
    chiefComplaint: 'Chakkar and ghabrahat',
    vitals: {},
  },
  {
    label: 'Test Case 4: Hypertensive Crisis',
    badge: 'IMMEDIATE',
    badgeSub: 'SBP 210 mmHg',
    patientName: 'Gopal Lal',
    age: 58,
    gender: 'MALE',
    chiefComplaint: 'Severe occipital headache and blurring of vision',
    vitals: {
      systolicBp: 210,
      diastolicBp: 118,
      pulse: 88,
      spo2: 97,
    },
  },
  {
    label: 'Test Case 5: Acute Pet Dard',
    badge: 'SOON',
    badgeSub: 'Abdominal Distress',
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
    return evaluateTriage(triageInput);
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
      setErrorMessage('Please enter Patient Name.');
      return;
    }
    if (age.trim() === '' || isNaN(Number(age))) {
      setErrorMessage('Please enter a valid Patient Age.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setErrorMessage('Please provide Chief Complaint / Symptoms.');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Quick Load Test Cases Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Quick Load Clinical Test Cases (Hackathon Scenarios)
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-800 transition font-medium"
          >
            Clear Form
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {QUICK_TEST_CASES.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadTestCase(tc)}
              className="text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    {tc.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{tc.chiefComplaint}</p>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    tc.badge === 'IMMEDIATE'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : tc.badge === 'SOON'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {tc.badge}
                </span>
                <span className="text-[11px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
                  Load &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-emerald-800">
                  Token Issued Successfully:
                </span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  Token #{successBanner.tokenNumber}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Patient <strong className="text-slate-900">{successBanner.patientName}</strong> triaged
                as <strong className="text-emerald-800">[{successBanner.priority}]</strong> and
                queued into Doctor workstation.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToDashboard}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs"
          >
            View in Nursing Station &rarr;
          </button>
        </div>
      )}

      {/* Two Column Layout: Ingestion Form & Real-Time Triage Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Patient Intake & Vitals Ingestion Form
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Counter Desk</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Demographic Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramprasad Sharma"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  aria-label="Patient Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as PatientGender)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Chief Complaint / Symptoms */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Chief Complaint & Symptoms (English / Hindi Transliteration) *
                </label>
                <span className="text-[11px] text-slate-500">
                  e.g., &quot;chest pain&quot;, &quot;saas lene me dikkat&quot;, &quot;chakkar&quot;
                </span>
              </div>
              <textarea
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe presenting complaint (e.g. Tightness in chest, severe sweating, pet dard)..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            {/* Physiological Vitals Section */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Physiological Vitals (Optional / At-Desk Assessment)
                  </span>
                </div>
                <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Missing vitals trigger fail-safe escalation
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Systolic BP */}
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Systolic BP
                    <span className="text-[9px] text-slate-400 block">mmHg (90-120)</span>
                  </label>
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value)}
                    placeholder="e.g. 155"
                    className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Diastolic BP */}
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Diastolic BP
                    <span className="text-[9px] text-slate-400 block">mmHg (60-80)</span>
                  </label>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(e.target.value)}
                    placeholder="e.g. 95"
                    className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Pulse */}
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Pulse Rate
                    <span className="text-[9px] text-slate-400 block">bpm (60-100)</span>
                  </label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="e.g. 112"
                    className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* SpO2 */}
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    SpO2 Saturation
                    <span className="text-[9px] text-slate-400 block">% (95-100)</span>
                  </label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="e.g. 93"
                    className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Temperature */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Temp
                    <span className="text-[9px] text-slate-400 block">°F (97.5-98.6)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="e.g. 98.4"
                    className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Token ID assignment */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Token ID Assignment:</span>
              <input
                type="text"
                value={tokenOverride}
                onChange={(e) => setTokenOverride(e.target.value)}
                placeholder="Auto (or specify e.g. 87, 23)"
                className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 w-44 placeholder-slate-400 font-mono"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Evaluating & Issuing...' : 'Issue OPD Token & Enqueue'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Instant Live Clinical Triage Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Instant Clinical Triage Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Deterministic Output
              </span>
            </div>

            {/* Calculated Priority Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                previewTriage.priority === 'IMMEDIATE'
                  ? 'bg-rose-50 border-rose-300'
                  : previewTriage.priority === 'SOON'
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-emerald-50 border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                  Target Priority Tier
                </span>
                {previewTriage.isFailSafeEscalation && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-white font-bold uppercase shadow-2xs">
                    Fail-Safe Escalated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {previewTriage.priority === 'IMMEDIATE' && (
                  <div className="h-10 w-10 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0 animate-urgent-pulse">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}
                {previewTriage.priority === 'SOON' && (
                  <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                )}
                {previewTriage.priority === 'ROUTINE' && (
                  <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <div
                    className={`text-xl font-bold tracking-tight ${
                      previewTriage.priority === 'IMMEDIATE'
                        ? 'text-rose-700'
                        : previewTriage.priority === 'SOON'
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    }`}
                  >
                    {previewTriage.priority}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {previewTriage.priority === 'IMMEDIATE' && 'Priority 1 (Red) • Immediate Doctor Resuscitation'}
                    {previewTriage.priority === 'SOON' && 'Priority 2 (Yellow) • Bedside Physician Review (<30 min)'}
                    {previewTriage.priority === 'ROUTINE' && 'Priority 3 (Green) • Standard Outpatient Care'}
                  </div>
                </div>
              </div>
            </div>

            {/* Factual Clinical Rationale Callout */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Factual Clinical Rationale String
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
                {previewTriage.clinicalRationale}
              </p>
            </div>

            {/* Matched Protocol Rules */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Matched Clinical Rules
              </span>
              <div className="space-y-1">
                {previewTriage.matchedRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safeguard Notice */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
              <strong className="text-slate-700 block">Triage Boundary Adherence:</strong>
              <p>
                Operates between registration and consultation. Does not speculate medical
                diagnosis; prioritizes queue based on Manchester / Indian National OPD protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
