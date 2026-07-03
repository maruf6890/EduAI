import { redirect } from "next/navigation";
import { getCookie } from "@/lib/cookies";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getCookie("access_token");

  if (token) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}