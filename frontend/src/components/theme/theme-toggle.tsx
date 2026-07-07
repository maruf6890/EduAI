"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme ?? theme) === "dark";

  return (
    <button
      type="button"
      aria-label={
        isDark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      aria-pressed={isDark}
      onClick={() =>
        setTheme(isDark ? "light" : "dark")
      }
      className={cn(
        "fixed top-20 right-10 sm:right-3 z-[60]",
        "flex h-12 w-12 items-center justify-center rounded-full",

        // Theme-aware colors
        "bg-surface border border-surface-border",
        "text-text-main",

        // Effects
        "backdrop-blur-xl shadow-soft",
        "transition-all duration-300",

        // Hover
        "hover:scale-105",
        "hover:border-brand-primary/40",
        "hover:text-brand-primary",
        "hover:shadow-glow",

        // Focus
        "focus:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-brand-primary/40"
      )}
    >
      {mounted ? (
        isDark ? (
          <Sun
            size={22}
            strokeWidth={1.8}
            className="text-brand-primary"
          />
        ) : (
          <Moon
            size={22}
            strokeWidth={1.8}
            className="text-text-main"
          />
        )
      ) : (
        <div className="h-5 w-5" />
      )}
    </button>
  );
}