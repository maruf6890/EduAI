"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // 🔑 Import path reader to keep navigation live
// 🔌 IMPORT THE PRIVATE API TRUCK
// import { fetchActiveClinicalQueue } from "@/actions/private_api_call";

// 📑 STEP 1: THE DATA CONTRACT
interface PatientRecord {
  id: string;
  name: string;
  meta: string;
  condition: string;
  level: "red" | "yellow" | "green";
  status: string;
}

// 🧭 Dynamic Navigation Directory Map Config
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" },
  { label: "Classrooms", href: "/dashboard/classrooms", icon: "M12 4v16m8-8H4" },
  { label: "Materials", href: "/dashboard/materials", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 100-8 4 4 0 000 8zm6 2a4 4 0 11-8 0" },
  { label: "Assignments", href: "/dashboard/analytics", icon: "M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H9.41a1 1 0 00-.7.29L5.3 8.7a1 1 0 00-.3.7V19a2 2 0 002 2z" },
  { label: "Quizzes", href: "/dashboard/analytics", icon: "M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H9.41a1 1 0 00-.7.29L5.3 8.7a1 1 0 00-.3.7V19a2 2 0 002 2z" },
  { label: "Announcements", href: "/dashboard/announcements", icon: "M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H9.41a1 1 0 00-.7.29L5.3 8.7a1 1 0 00-.3.7V19a2 2 0 002 2z" },
  { label: "Calendar", href: "/dashboard/calender", icon: "M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H9.41a1 1 0 00-.7.29L5.3 8.7a1 1 0 00-.3.7V19a2 2 0 002 2z" },


];


export default function AdminDashboard() {
  // 📊 Live Shift KPI Summary Metrics States
  const [processedCount, setProcessedCount] = useState(34);
  const [criticalCount, setCriticalCount] = useState(4);

  // 💾 STEP 2: THE MOUNTED ACTIVE STATE ARRAY
  const [currentShiftQueue, setCurrentShiftQueue] = useState<PatientRecord[]>([
    { id: "PT-8831", name: "Rahima Khatun", meta: "42 yrs / female", condition: "Severe chest constriction radiating to arm", level: "red", status: "Critical" },
    { id: "PT-1092", name: "Abul Kalam", meta: "61 yrs / male", condition: "Chronic dry cough, high-grade axillary fever", level: "yellow", status: "Observation" },
    { id: "PT-4402", name: "Sumi Akter", meta: "19 yrs / female", condition: "Mild skin laceration, updated local dressing care", level: "green", status: "Stable" }
  ]);

  // 🔌 THE REAL-TIME BACKEND HOOKUP
  useEffect(() => {
    async function syncDashboardData() {
      // const result = await fetchActiveClinicalQueue("session_auth_token_here");
      // if (result.success && result.queue) {
      //   setCurrentShiftQueue(result.queue.patients);
      //   setProcessedCount(result.queue.metaShiftCount);
      //   setCriticalCount(result.queue.metaCriticalCount);
      // }
    }
    syncDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      {/* Main content, offset by collapsed sidebar width */}
      <div className="space-y-8 p-6 pl-[88px] transition-all duration-300">

        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Clinical overview</h1>
          <p className="text-sm font-medium text-text-main/60">
            Real-time triage activity for the current shift.
          </p>
        </div>

        {/* 📊 KPI Cards using your custom Tailwind variables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] backdrop-blur-md p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between shadow-lg hover:border-brand-primary/30 transition-all duration-300">
            <span className="text-[10px] font-extrabold text-text-main/40 uppercase tracking-wider">Processed this shift</span>
            <span className="text-3xl font-black text-text-main mt-2 tracking-tight">{processedCount} cases</span>
          </div>

          {/* Dynamic Warning Card themed with your secondary accent tint */}
          <div className="bg-brand-primary/[0.06] backdrop-blur-md p-6 rounded-2xl border border-brand-primary/20 flex flex-col justify-between shadow-lg hover:border-brand-primary/40 transition-all duration-300">
            <span className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider">Urgent actions</span>
            <span className="text-3xl font-black text-brand-primary mt-2 tracking-tight drop-shadow-[0_0_12px_rgba(243,171,104,0.2)]">{criticalCount} critical</span>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-md p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between shadow-lg hover:border-brand-accent/30 transition-all duration-300">
            <span className="text-[10px] font-extrabold text-text-main/40 uppercase tracking-wider">System status</span>
            <span className="text-sm font-extrabold text-brand-accent mt-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-accent animate-pulse shadow-[0_0_8px_rgba(232,223,124,0.6)]" /> All records synced
            </span>
          </div>
        </div>

        {/* 📋 Queue Data-Driven Table */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-text-main">Active shift queue</h3>
              <p className="text-xs font-medium text-text-main/50 mt-0.5">Real-time clinical prioritization for the current shift.</p>
            </div>
            <Link
              href="/intake-wizard"
              className="bg-brand-primary text-dark-bg-main hover:bg-brand-primary/95 font-black text-xs px-5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider shadow-lg shadow-brand-primary/20"
            >
              New intake session
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/[0.08] text-text-main/40 text-[10px] font-extrabold tracking-wider uppercase">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Demographics</th>
                  <th className="px-6 py-4">Presenting symptom</th>
                  <th className="px-6 py-4">Triage status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm text-text-main">
                {/* 🔄 STEP 3: THE DYNAMIC UI MAP */}
                {currentShiftQueue.map((patient) => (
                  <tr key={patient.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="px-6 py-4">
                      <span className="font-bold text-text-main block">{patient.name}</span>
                      <span className="text-xs font-mono text-text-main/40 block mt-0.5">{patient.id}</span>
                    </td>
                    <td className="px-6 py-4 text-text-main/70 font-medium">
                      {patient.meta}
                    </td>
                    <td className="px-6 py-4 text-text-main/60 max-w-xs truncate font-medium">
                      {patient.condition}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${patient.level === 'red' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        patient.level === 'yellow' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${patient.level === 'red' ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                          patient.level === 'yellow' ? 'bg-brand-accent' :
                            'bg-emerald-500'
                          }`}></span>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-brand-primary hover:text-dark-bg-main font-bold text-xs tracking-wide bg-brand-primary/10 hover:bg-brand-primary px-4 py-2.5 rounded-lg border border-brand-primary/20 hover:border-transparent transition-all duration-200 cursor-pointer">
                        Review case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/ai-chatbot"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md shadow-xl hover:bg-white/20 active:scale-95 transition-all duration-200 border border-white/10 hover:shadow-brand-primary/20 hover:shadow-2xl group"
        aria-label="Talk to AI Triage Assistant"
      >
        {/* 🛠️ Dynamic Orange Icon Fix: Wrapped the icon in a container to apply the blend effect */}
        <div className="bg-brand-primary h-10 w-10 rounded-full flex items-center justify-center p-0.5 mix-blend-multiply transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:bg-brand-accent">
          <img
            src="https://img.icons8.com/ink/48/chatbot.png"
            alt="chatbot"
            className="h-8 w-8 object-contain"
          />
        </div>
      </Link>
    </div>
  );
}