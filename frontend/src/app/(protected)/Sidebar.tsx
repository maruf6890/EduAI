"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCookie } from "@/lib/cookies";

const NAV_ITEMS = [
  // { label: "Home", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" },
  { label: "Classrooms", href: "/dashboard/classrooms", icon: "M12 4v16m8-8H4" },
  { label: "Calendar", href: "/calendar", icon: "M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H9.41a1 1 0 00-.7.29L5.3 8.7a1 1 0 00-.3.7V19a2 2 0 002 2z" },
  { label: "Profile", href: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await deleteCookie("access_token");
      await deleteCookie("refresh_token");
      await deleteCookie("id");
      await deleteCookie("email");
      await deleteCookie("name");
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="group fixed left-0 top-0 z-40 flex h-screen w-[68px] flex-col border-r border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] backdrop-blur-md transition-all duration-300 ease-out hover:w-64 hover:shadow-2xl">

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 dark:border-white/[0.08] px-4 overflow-hidden">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#8168f3]">
          <span className="text-white font-black text-sm">E</span>
        </div>
        <span className="whitespace-nowrap text-sm font-extrabold text-gray-900 dark:text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Edu AI
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-sm font-bold transition-colors overflow-hidden ${isActive
                  ? "bg-[#8168f3]/10 text-[#8168f3]"
                  : "text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
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

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-white/[0.08]">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-sm font-bold transition-colors overflow-hidden text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {loggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>

    </aside>
  );
}