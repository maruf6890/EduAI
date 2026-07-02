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
            <img width="150" height="150" src="./LOGO.png" alt="cursor-ai" />
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
              <img width="25" height="25" src="https://img.icons8.com/sci-fi/48/cancel.png" alt="cancel" />
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
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-text-main/50 cursor-pointer">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                disabled={loading}
                className="w-3.5 h-3.5 rounded border-surface-border accent-brand-primary"
              />
              Keep me signed in
            </label>
            <a href="#" className="text-xs text-brand-primary hover:text-brand-accent transition">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-[var(--radius-sm)] bg-brand-primary text-bg-main text-sm font-semibold
                     hover:bg-brand-accent active:scale-[0.98] transition
                     disabled:opacity-50 cursor-pointer shadow-[var(--shadow-glow)]"
          >
            {loading ? "Authenticating..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[11px] text-text-main/30">
          <span className="flex-1 border-t border-dashed border-surface-border" />
          Or sign in with
          <span className="flex-1 border-t border-dashed border-surface-border" />
        </div>

        {/* Social buttons */}
        <div className="flex gap-3">
          {(["google", "facebook", "apple"] as const).map((provider) => (
            <button
              key={provider}
              onClick={() => handleSocialLogin(provider)}
              disabled={loading}
              aria-label={`Sign in with ${provider}`}
              className="flex-1 h-11 rounded-[var(--radius-sm)] border border-surface-border bg-surface
                       hover:border-brand-primary/40 hover:bg-brand-primary/5
                       flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
            >
              {provider === "google" && (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {provider === "facebook" && (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              {provider === "apple" && (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-text-main/40">
          New here?{" "}
          <a href="/register" className="text-brand-primary hover:text-brand-accent transition">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
