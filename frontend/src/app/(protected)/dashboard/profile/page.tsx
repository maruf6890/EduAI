import { getCookie } from "@/lib/cookies";
import ProfileInfo from "./ProfileInfo";


export default async function ProfilePage() {
  const name = await getCookie("name");
  const email = await getCookie("email");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] px-4 py-8 md:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account information and password
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Avatar + name card */}
        <div className="lg:col-span-1">
          <div className="rounded-[20px] border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 flex flex-col items-center text-center shadow-sm">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full bg-[#8168f3] flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
              {name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {name ?? "User"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {email ?? ""}
            </p>
            <div className="mt-4 w-full border-t border-gray-100 dark:border-white/10 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Edit forms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ProfileInfo initialName={name ?? ""} initialEmail={email ?? ""} />
          
        </div>
      </div>
    </div>
  );
}