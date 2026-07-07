'use client';

import { cn } from "@/lib/utils";
import { User } from "lucide-react"; // Or your custom icon
import { useRouter } from "next/navigation";

export default function ProfileButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/profile')} // Adjust your redirect path here
            aria-label="Go to Profile"
            className={cn(
                "fixed top-4 right-4 z-[60]",
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
            <User className="h-6 w-6" />
        </button>
    );
}