"use client";

import { useState, useEffect } from "react";

// 📑 STEP 1: THE HISTORICAL DATA CONTRACT
interface HistoricalLog {
  visit_id: string;
  patient_name: string;
  date: string;
  age_gender: string;
  primary_diagnosis: string;
  prescribed_meds: string;
}

export default function PatientsLogsPage() {
  // 💾 STEP 2: MOUNTED ARCHIVE STATE ARRAY (With default hackathon preview data)
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalLog[]>([
    {
      visit_id: "VST-9901",
      patient_name: "Anwara Begum",
      date: "2026-06-11",
      age_gender: "55 Yrs / Female",
      primary_diagnosis: "Type 2 Diabetes Control / Mild Hypertension",
      prescribed_meds: "Metformin 500mg, Losartan 50mg"
    },
    {
      visit_id: "VST-9874",
      patient_name: "Tamim Iqbal",
      date: "2026-06-10",
      age_gender: "28 Yrs / Male",
      primary_diagnosis: "Acute Bacterial Bronchitis",
      prescribed_meds: "Azithromycin 500mg, Paracetamol"
    },
    {
      visit_id: "VST-9850",
      patient_name: "Lipika Roy",
      date: "2026-06-08",
      age_gender: "34 Yrs / Female",
      primary_diagnosis: "Iron Deficiency Anemia Baseline Check",
      prescribed_meds: "Ferrous Sulfate, Folic Acid"
    }
  ]);

  useEffect(() => {
    // 🔌 THE HOOKUP: Runs automatically later to pull completed cases from the DB archive
    async function fetchArchive() {
      // const response = await fetch('/api/v1/clinical/archive-logs');
      // const data = await response.json();
      // if (response.ok) setHistoricalLogs(data);
    }
    fetchArchive();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header titles */}
      <div>
        <h1 className="text-xl font-extrabold text-text-main tracking-tight">Historical Patient Logs</h1>
        <p className="text-xs font-medium text-text-main/60 mt-0.5">
          Archived record entries of all completed community healthcare checks.
        </p>
      </div>

      {/* Main Logs Table Container */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/[0.08] text-text-main/40 text-[10px] font-extrabold tracking-wider uppercase">
                <th className="px-6 py-4">Visit ID & Date</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Demographics</th>
                <th className="px-6 py-4">Clinical Conclusion / Diagnosis</th>
                <th className="px-6 py-4">Prescription Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm text-text-main">
              {/* 🔄 STEP 3: DYNAMIC MAP MATRIX */}
              {historicalLogs.map((log) => (
                <tr key={log.visit_id} className="hover:bg-white/[0.02] transition-colors duration-200">
                  <td className="px-6 py-4">
                    <span className="font-bold text-text-main block">{log.visit_id}</span>
                    <span className="text-xs text-text-main/40 block mt-0.5">{log.date}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-text-main">
                    {log.patient_name}
                  </td>
                  <td className="px-6 py-4 text-text-main/70 font-medium">
                    {log.age_gender}
                  </td>
                  <td className="px-6 py-4 text-text-main/60 font-medium max-w-xs">
                    {log.primary_diagnosis}
                  </td>
                  <td className="px-6 py-4 text-text-main/50 font-medium">
                    {log.prescribed_meds}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}