"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Particles } from "@/components/ui/particles"; // Adjust import path if needed
import { public_api_call } from "@/actions/public_api_call";

export default function Register() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!fullName || !email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        const payload = {
            full_name: fullName,
            email: email,
            password: password
        }

        setLoading(true);

        try {
            // Replace with your actual backend integration/fetch call
            const res = await public_api_call({ path: "auth/register", method: "POST", body: payload });


            if (res.success) {
                // Redirect to login or admin dashboard upon successful registration
                router.push("/login");
            } else {
                setError(res.message || "Registration failed. Please try again.");
            }
        } catch (err: any) {
            setError(err.message || "Server connection timed out.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-bg-main overflow-hidden">
            {/* Particles background */}
            <Particles
                className="absolute inset-0 z-0"
                quantity={200}
                color="#aae1e9"
                ease={80}
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm rounded-[var(--radius-lg)] p-8 flex flex-col gap-5
                    bg-surface border border-surface-border shadow-[var(--shadow-soft)]
                    backdrop-blur-xl">

                {/* Brand label */}
                <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/50" />
                    <span className="text-[11px] font-medium text-text-main/50 tracking-widest uppercase">
                        ClassMind AI
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/50" />
                </div>

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-[var(--radius-md)] bg-brand-primary/10
                        border border-brand-primary/25 flex items-center justify-center
                        shadow-[var(--shadow-glow)]">
                        <img width="64" height="64" src="https://img.icons8.com/nolan/64/cursor-ai.png" alt="cursor-ai" />
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center">
                    <h1 className="text-lg font-semibold text-text-main">Create an account</h1>
                    <p className="text-xs text-text-main/40 mt-1">Get started with ClassMind AI.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 rounded-[var(--radius-sm)] bg-danger/10 border border-danger/20
                          text-xs font-semibold text-danger">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Full Name */}
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
                        <input
                            type="text"
                            placeholder="Full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={loading}
                            className="h-11 w-full pl-10 pr-4 rounded-[var(--radius-sm)]
                       border border-surface-border bg-surface
                       text-sm text-text-main placeholder:text-text-main/30
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50
                       disabled:opacity-50 transition"
                        />
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="h-11 w-full pl-10 pr-4 rounded-[var(--radius-sm)]
                       border border-surface-border bg-surface
                       text-sm text-text-main placeholder:text-text-main/30
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50
                       disabled:opacity-50 transition"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="h-11 w-full pl-10 pr-10 rounded-[var(--radius-sm)]
                       border border-surface-border bg-surface
                       text-sm text-text-main placeholder:text-text-main/30
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50
                       disabled:opacity-50 transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            disabled={loading}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-text-main/30 hover:text-text-main/60 transition"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-11 mt-2 rounded-[var(--radius-sm)] bg-brand-primary text-bg-main text-sm font-semibold
                     hover:bg-brand-primary/70 active:scale-[0.98] transition
                     disabled:opacity-50 cursor-pointer shadow-[var(--shadow-glow)]"
                    >
                        {loading ? "Signing up..." : "Sign up"}
                    </button>
                </form>

                <p className="text-center text-xs text-text-main/40">
                    Already have an account?{" "}
                    <a href="/login" className="text-brand-primary hover:text-brand-secondary transition">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}