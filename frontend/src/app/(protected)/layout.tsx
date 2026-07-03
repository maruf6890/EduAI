import { redirect } from "next/navigation";
import { getCookie } from "@/lib/cookies";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getCookie("access_token");

  if (!token) {
    redirect("/login");
  }

  return <>{children}</>;
}