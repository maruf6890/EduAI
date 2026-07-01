
// import { redirect } from "next/navigation";
// // Replace the import path below with your actual auth configuration file
// import { private_api_call } from "@/actions/private_api_call";

// interface ApiResponse {
//     user: {
//         name: string;
//         email: string;
//     };
// }

// export default async function ProfilePage() {
//     // 1. Fetch your custom session/user data
//     const res = await private_api_call({ path: "auth/me", method: "GET" });

//     const user = result.data;

//     return (
//         <main className="max-w-2xl mx-auto p-8">
//             <h1 className="text-3xl font-bold mb-6">User Profile</h1>

//             <div className="bg-white shadow rounded-lg p-6">
//                 <div className="mb-4">
//                     <label className="block text-gray-700 font-bold">Name</label>
//                     <p className="text-gray-900">{user.name || "N/A"}</p><p className="text-gray-900">{user.email || "N/A"}</p>
//                 </div>

//                 <div className="mb-4">
//                     <label className="block text-gray-700 font-bold">Email</label>
//                     <p className="text-gray-900">{user.email || "N/A"}</p>
//                 </div>
//                 <div>
//                     <button className="bg-red-500 text-white px-4 py-2 rounded-lg">Logout</button>
//                 </div>
//             </div>
//         </main>
//     );
// }