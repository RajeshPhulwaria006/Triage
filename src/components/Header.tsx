'use client';

import React from 'react';
import Link from 'next/link';
import { StaffProfile } from '@/types/triage';
import {
  Activity,
  ClipboardList,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

export type ActiveTab = 'REGISTER' | 'DASHBOARD' | 'AUDIT';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
  staffProfiles: StaffProfile[];
  activeStaff: StaffProfile;
  onStaffChange: (staff: StaffProfile) => void;
  isPolling: boolean;
  onManualRefresh: () => void;
  onResetSeedData: () => void;
  waitingCount: number;
  immediateCount: number;
  useLinks?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  staffProfiles,
  activeStaff,
  onStaffChange,
  isPolling,
  onManualRefresh,
  onResetSeedData,
  waitingCount,
  immediateCount,
  useLinks = false,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top hospital institution bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-[10px]">
            SN
          </div>
          <span className="font-semibold text-slate-800">
            Dr. S.N. Medical College & Associated Hospitals, Jodhpur
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="hidden sm:inline text-slate-600">
            Aayu 2026 AI Medical Hackathon — Track 01 (OPD Flow)
          </span>
        </div>

        {/* Staff badge switcher & Reset seeds */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500 hidden md:inline text-[11px]">Active Staff:</span>
            <select
              aria-label="Active Staff Badge"
              value={activeStaff.id}
              onChange={(e) => {
                const found = staffProfiles.find((s) => s.id === e.target.value);
                if (found) onStaffChange(found);
              }}
              className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer"
            >
              {staffProfiles.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-800">
                  [{s.badgeNumber}] {s.name} - {s.role}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onResetSeedData}
            title="Reset queue and test cases to default baseline"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs transition border border-slate-200 font-medium"
          >
            <RotateCcw className="w-3 h-3 text-amber-600" />
            <span className="hidden sm:inline">Reset Seeds</span>
          </button>
        </div>
      </div>

      {/* Main navigation and workstation switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                OPD FLOW
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Deterministic Triage
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-500">
              Explainable Clinical Prioritization & Queue Flow
            </p>
          </div>
        </div>

        {/* Workstation switch tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {useLinks ? (
            <>
              <Link
                href="/register"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'REGISTER'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Registration Desk</span>
              </Link>
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition relative ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Nursing Station</span>
                {waitingCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      immediateCount > 0
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {waitingCount}
                  </span>
                )}
              </Link>
              <Link
                href="/audit"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'AUDIT'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compliance & Audit</span>
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => onTabChange && onTabChange('REGISTER')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'REGISTER'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Registration Desk</span>
              </button>

              <button
                onClick={() => onTabChange && onTabChange('DASHBOARD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition relative ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Nursing Station</span>
                {waitingCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      immediateCount > 0
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {waitingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange && onTabChange('AUDIT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'AUDIT'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compliance & Audit</span>
              </button>
            </>
          )}
        </nav>

        {/* Live sync heartbeat */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isPolling ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-700 font-medium">Live (2s Poll)</span>
          </div>

          <button
            onClick={onManualRefresh}
            title="Refresh Queue Now"
            className="p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
