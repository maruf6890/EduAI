"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" },
  { label: "Classrooms", href: "/dashboard/classrooms", icon: "M12 4v16m8-8H4" },
  // { label: "Materials", href: "/dashboard/materials", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 100-8 4 4 0 000 8zm6 2a4 4 0 11-8 0" },
  // { label: "Assignments", href: "/dashboard/assignment", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  // { label: "Quizzes", href: "/dashboard/quizzes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  // { label: "Announcements", href: "/dashboard/announcements", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.155B1.76 1.76 0 003.76 12H3a1 1 0 01-1-1V7a1 1 0 011-1h4.76a1.76 1.76 0 001.654-1.176l1.188-3.266A1.76 1.76 0 0111 5.882zm10 0v12.358a1.76 1.76 0 01-3.417.592l-2.147-6.155A1.76 1.76 0 0013.76 12H13a1 1 0 01-1-1V7a1 1 0 011-1h4.76a1.76 1.76 0 001.654-1.176l1.188-3.266A1.76 1.76 0 0121 5.882zM11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.155B1.76 1.76 0 003.76 12H3a1 1 0 01-1-1V7a1 1 0 011-1h4.76a1.76 1.76 0 001.654-1.176l1.188-3.266A1.76 1.76 0 0111 5.882zm10 0v12.358a1.76 1.76 0 01-3.417.592l-2.147-6.155A1.76 1.76 0 0013.76 12H13a1 1 0 01-1-1V7a1 1 0 011-1h4.76a1.76 1.76 0 001.654-1.176l1.188-3.266A1.76 1.76 0 0121 5.882z" },
  // { label: "Calendar", href: "/calendar", icon: "M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H9.41a1 1 0 00-.7.29L5.3 8.7a1 1 0 00-.3.7V19a2 2 0 002 2z" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-dark-bg-main text-text-main-white">
      {/* 🧭 The Shared Hover-Expanding Sidebar Element */}
      <aside className="group fixed left-0 top-0 z-40 flex h-screen w-[68px] flex-col border-r border-white/[0.08] bg-white/[0.02] backdrop-blur-md transition-all duration-300 ease-out hover:w-64 hover:shadow-2xl">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-4 overflow-hidden">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center  font-black text-dark-bg-main">
            <img width="250" height="250" src="./LOGO.png" alt="cursor-ai" />

          </div>
          <span className="whitespace-nowrap text-sm font-extrabold text-text-main-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Edu AI
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-bold transition-colors overflow-hidden ${isActive
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-text-main-white/60 hover:bg-white/[0.05] hover:text-text-main-white"
                  }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* 🔓 Right Content View Container with Sidebar offset margin spacing built-in */}
      <div className="space-y-8 p-6 pl-[88px] transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
