
import { redirect } from "next/navigation";
// Replace the import path below with your actual auth configuration file
import { private_api_call } from "@/actions/private_api_call";

interface ApiResponse {
    user: {
        name: string;
        email: string;
    };
}

export default async function ProfilePage() {
    // 1. Fetch your custom session/user data
    const res = await private_api_call({ path: "auth/me", method: "GET" });

    if (!res?.success) {
        console.log(res);
        return (
            <pre>{JSON.stringify(res, null, 2)}</pre>
        );
    }

    const user = res.data as ApiResponse;

    return (
        <main className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">User Profile</h1>

            <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold">Name</label>
                    <p className="text-gray-900">{user.user.name || "N/A"}</p>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold">Email</label>
                    <p className="text-gray-900">{user.user.email || "N/A"}</p>
                </div>
            </div>
        </main>
    );
}