"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SendIcon, LoaderIcon } from "lucide-react";
import { motion } from "framer-motion";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface AnimatedAIChatProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholderText?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFocus: () => void;
  onBlur: () => void;
  LoadingMessages: boolean;
  isGenerating: boolean;
}

// ─── Textarea sub-component ───────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "border-white/[0.08] bg-white/[0.02] flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-text-main-white/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing
              ? "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
              : "",
            className,
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {showRing && isFocused && (
          <motion.span
            className="ring-brand-primary/30 pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

// ─── Main presentational component ───────────────────────────────────────────

export default function AnimatedAIChat({
  value,
  onChange,
  onSend,
  placeholderText = "Ask AI a question...",
  textareaRef,
  onFocus,
  onBlur,
  LoadingMessages,
  isGenerating,
}: AnimatedAIChatProps) {
  return (
    <div className="flex w-full bg-transparent">
      <div className="text-text-main-white relative flex w-full flex-col items-center overflow-hidden p-6">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
          <div className="bg-brand-primary/10 absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full mix-blend-normal blur-[128px] filter" />
          <div className="bg-brand-secondary/10 absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full mix-blend-normal blur-[128px] filter delay-700" />
          <div className="bg-brand-accent/5 absolute top-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full mix-blend-normal blur-[96px] filter delay-1000" />
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <motion.div
            className="relative z-10 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Chat box */}
            <motion.div
              className="border-white/[0.08] flex items-center gap-2 bg-white/[0.02] relative rounded-2xl border shadow-2xl backdrop-blur-2xl p-1"
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Textarea wrapper */}
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder={placeholderText}
                  containerClassName="w-full"
                  className={cn(
                    "w-full px-3 py-2",
                    "resize-none bg-transparent border-none",
                    "text-text-main-white text-sm",
                    "focus:outline-none",
                    "placeholder:text-text-main-white/40",
                  )}
                  showRing={false}
                />
              </div>

              {/* Send button */}
              <motion.button
                type="button"
                onClick={onSend}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isGenerating || !value.trim() || LoadingMessages}
                className={cn(
                  "shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition-all",
                  "flex items-center gap-2",
                  value.trim() && !isGenerating
                    ? "bg-brand-primary text-dark-bg-main shadow-brand-primary/25 shadow-lg hover:bg-brand-primary/95"
                    : "bg-white/[0.04] text-text-main-white/30 border border-white/[0.08]",
                )}
              >
                {isGenerating ? (
                  <LoaderIcon className="h-4 w-4 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
                <span>Send</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
