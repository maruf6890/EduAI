"use client";

import { useState } from "react";
import { private_api_call } from "@/actions/private_api_call";
import { setCookie } from "@/lib/cookies";
import ChangePasswordModel from "./ChangePasswordModel";

interface Props {
  initialName: string;
  initialEmail: string;
}

export default function ProfileInfo({ initialName, initialEmail }: Props) {
  const [name, setName] = useState(initialName);
  const [email] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await private_api_call({
        path: "auth/me",
        method: "PUT",
        body: { full_name: name.trim() },
      });

      if (res.success) {
        await setCookie("name", res.data.user.full_name);
        setSuccess("Profile updated successfully");
      } else {
        setError(res.message || "Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="lg:col-span-2 flex flex-col gap-6">
      <div className="rounded-[20px] border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          Personal Information
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Update your display name
        </p>

        <form className="flex flex-col gap-4">
          {/* Full name */}
          {
            isEditing ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[12px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#8168f3] focus:ring-2 focus:ring-[#8168f3]/20 transition"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  readOnly
                  className="w-full rounded-[12px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#8168f3] focus:ring-2 focus:ring-[#8168f3]/20 transition"
                />
              </div>
            )
          }

          {/* Email - readonly */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-[12px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#8168f3] focus:ring-2 focus:ring-[#8168f3]/20 transition"
            />
            {
              isEditing && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Email cannot be changed
                </p>
              )
            }
          </div>

          {/* Error / Success */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-[8px] px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 rounded-[8px] px-3 py-2">
              {success}
            </p>
          )}

          {
            isEditing ? (
              <div className="mt-2 flex gap-2 sm:self-end">
                <button
                  type="button"
                  onClick={() => {
                    setName(initialName);
                    setError("");
                    setSuccess("");
                    setIsEditing(false);
                  }}
                  className="w-full sm:w-auto rounded-[12px] border border-gray-200 dark:border-white/10 px-6 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="mt-2 w-full sm:w-auto sm:self-end rounded-[12px] bg-[#8168f3] hover:bg-[#6f57e0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 transition"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2 sm:self-end">
                <button
                  type="submit"
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-2 w-full sm:w-auto sm:self-end rounded-[12px] bg-[#8168f3] hover:bg-[#6f57e0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 transition"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="mt-2 w-full sm:w-auto sm:self-end rounded-[12px] bg-[#8168f3] hover:bg-[#6f57e0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 transition"
                >
                  Change Password
                </button>
              </div>
            )
          }


        </form>
      </div>

      {showChangePassword && (
        <ChangePasswordModel onClose={() => setShowChangePassword(false)} />
      )}
    </div>

  );
}