import { redirect } from "next/navigation";
import { getCookie } from "@/lib/cookies";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

  const token = await getCookie("access_token");

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg-main dark:bg-[#09090b] text-gray-900 dark:text-white">
      <Sidebar />
      <div className="min-h-screen p-6 pl-[88px] transition-all duration-300">
        {children}
      </div>
    </div>
  );
}