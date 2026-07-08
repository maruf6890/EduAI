"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Calendar, Users, User, LogOut } from "lucide-react";
import { deleteCookie } from "@/lib/cookies";

const NAV_ITEMS = [
  { label: "Classrooms", href: "/dashboard/classrooms", icon: LayoutGrid },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Community Classrooms", href: "/community-classrooms", icon: Users },
  { label: "Profile", href: "/profile", icon: User },
];

export default function Sidebar({ name }: { name: string | null }) {
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
          <span className="text-white font-black text-sm">
            <img width="64" height="64" src="https://img.icons8.com/nolan/64/cursor-ai.png" alt="cursor-ai" />
          </span>
        </div>
        <span className="whitespace-nowrap text-sm font-extrabold text-brand-primary dark:text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Edu AI
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-sm font-bold transition-colors overflow-hidden ${
                isActive
                  ? "bg-[#8168f3]/10 text-[#8168f3]"
                  : "text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {item.label==="Profile" && name ? `${name}` : item.label}
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
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {loggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>

    </aside>
  );
}