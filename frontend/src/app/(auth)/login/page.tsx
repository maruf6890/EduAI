"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Eye, EyeOff, Mail, Lock, AirVent, AtSignIcon, Airplay } from "lucide-react";
import { public_api_call } from "@/actions/public_api_call";
import { Particles } from "@/components/ui/particles";
import { setCookie } from "@/lib/cookies";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both an email/staff ID and password.");
      return;
    }

    setLoading(true);
    const response = await public_api_call({ path: "auth/login", method: "POST", body: { email, password, keepSignedIn } });
    setLoading(false);

    if (response.success) {
      await setCookie('access_token', response.data.access_token);
      await setCookie('refresh_token', response.data.refresh_token);
      await setCookie('id', response.data.user.id.toString());
      await setCookie('email', response.data.user.email);
      await setCookie('name', response.data.user.full_name);
      router.push("/dashboard");
    } else {
      setError(response.message || "Invalid credentials or server connection timed out.");
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    setLoading(true);
    setError("");
    try {
      const response = await public_api_call({ path: "auth/google", method: "POST" });
      if (response.success) {
        await setCookie('access_token', response.data.access_token);
        await setCookie('refresh_token', response.data.refresh_token);
        await setCookie('id', response.data.user.id.toString());
        await setCookie('email', response.data.user.email);
        await setCookie('name', response.data.user.full_name);
        router.push("/dashboard");
      } else {
        setError(response.message || "Social login failed.");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Social login failed.");
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
            Edu-AI
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/50" />
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center">
            {/* <img width="150" height="150" src="./LOGO.png" alt="cursor-ai" /> */}
            <img width="64" height="64" src="https://img.icons8.com/nolan/64/cursor-ai.png" alt="cursor-ai" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-lg font-semibold text-text-main">Welcome back!!!!</h1>
          <p className="text-xs text-text-main/40 mt-1">Sign in to continue your classroom.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-danger flex items-center gap-2">
              {/* <img width="25" height="25" src="https://img.icons8.com/sci-fi/48/cancel.png" alt="cancel" /> */}
              <img width="25" height="25" src="https://img.icons8.com/dusk/64/error--v1.png" alt="error--v1" />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
            <input
              type="text"
              placeholder="Email or staff ID"
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

          {/* Keep signed in / forgot */}
          <div className="flex items-center justify-between ">
            {/* <label className="flex items-center gap-2 text-xs text-text-main/50 cursor-pointer">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                disabled={loading}
                className="w-3.5 h-3.5 rounded border-surface-border accent-brand-primary"
              />
              Keep me signed in
            </label> */}
            <a href="#" className="text-xs text-brand-primary hover:text-brand-primary transition">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-[var(--radius-sm)] bg-brand-primary text-bg-main text-sm font-semibold
                     hover:bg-brand-primary active:scale-[0.98] transition
                     disabled:opacity-50 cursor-pointer shadow-[var(--shadow-glow)]"
          >
            {loading ? "Authenticating..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        {/* <div className="flex items-center gap-3 text-[11px] text-text-main/30">
          <span className="flex-1 border-t border-dashed border-surface-border" />
          Or sign in with
          <span className="flex-1 border-t border-dashed border-surface-border" />
        </div> */}

       

        <p className="text-center text-xs text-text-main/40">
          New here?{" "}
          <a href="/register" className="text-brand-primary hover:text-brand-primary/70 transition">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
