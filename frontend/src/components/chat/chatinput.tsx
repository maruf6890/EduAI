"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Paperclip,
  SendIcon,
  XIcon,
  LoaderIcon,
  Sparkles,
  Command,
  Camera,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}
 
export interface AttachmentFile {
  id: string;
  name: string;
  url?: string;
  type: "image" | "pdf" | "audio" | "unknown";
}
 
export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}
 
export interface AnimatedAIChatProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholderText?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  attachments: AttachmentFile[];
  onAttachFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCapturePicture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptureAudio: () => void;
  onRemoveAttachment: (id: string) => void;
  models: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  commandSuggestions?: CommandSuggestion[];
  showCommandPalette: boolean;
  activeSuggestion: number;
  onToggleCommandPalette: () => void;
  onSelectCommand: (prefix: string) => void;
  commandPaletteRef: React.RefObject<HTMLDivElement | null>;
  isGenerating: boolean;
  inputFocused: boolean;
  mousePosition: { x: number; y: number };
}
 
// ─── Textarea sub-component ───────────────────────────────────────────────────
 
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}
 
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
 
    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "border-white/[0.08] bg-white/[0.02] flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-text-main-white/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none" : "",
            className,
          )}
          ref={ref}
          onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
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
  onKeyDown,
  onFocus,
  onBlur,
  attachments,
  onAttachFiles,
  onCapturePicture,
  onRemoveAttachment,
  onCaptureAudio,
  models,
  selectedModel,
  onSelectModel,
  commandSuggestions = [],
  showCommandPalette,
  activeSuggestion,
  onToggleCommandPalette,
  onSelectCommand,
  commandPaletteRef,
  isGenerating,
  inputFocused,
  mousePosition,
}: AnimatedAIChatProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // ✅ FIX 2: audioInputRef is declared and wired to onAttachFiles (not a separate handler)
  const audioInputRef = useRef<HTMLInputElement>(null);
 
  return (
    <div className="flex w-full bg-transparent">
      {/*
        ✅ FIX 2: Hidden inputs.
        - fileInputRef   → general files (images, PDFs, etc.) → onAttachFiles
        - cameraInputRef → camera capture                     → onCapturePicture
        - audioInputRef  → audio files (.mp3, .wav, etc.)     → onAttachFiles
          Using onAttachFiles (not a separate handler) means the audio MIME check
          in page.tsx (`f.type.startsWith("audio/")`) fires correctly.
      */}
      <input type="file" ref={fileInputRef} onChange={onAttachFiles} multiple className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={onCapturePicture} accept="image/*" capture="environment" className="hidden" />
      {/* ✅ FIX 2: was previously calling wrong handler */}
      <input
        type="file"
        ref={audioInputRef}
        onChange={onAttachFiles}
        accept="audio/*"
        className="hidden"
      />
 
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
              className="border-white/[0.08] bg-white/[0.02] relative rounded-2xl border shadow-2xl backdrop-blur-2xl"
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Command palette */}
              <AnimatePresence>
                {showCommandPalette && commandSuggestions.length > 0 && (
                  <motion.div
                    ref={commandPaletteRef}
                    className="border-white/[0.08] bg-dark-bg-main/95 absolute right-4 bottom-full left-4 z-50 mb-2 overflow-hidden rounded-lg border shadow-2xl backdrop-blur-xl"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="bg-dark-bg-main py-1">
                      {commandSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.prefix}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors",
                            activeSuggestion === index
                              ? "bg-brand-primary/10 text-brand-primary"
                              : "text-text-main-white/60 hover:bg-white/[0.04]",
                          )}
                          onClick={() => onSelectCommand(suggestion.prefix + " ")}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div className="text-brand-primary flex h-5 w-5 items-center justify-center">
                            {suggestion.icon}
                          </div>
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="text-brand-primary/60 ml-1 text-xs">{suggestion.prefix}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
 
              {/* Textarea */}
              <div className="p-4">
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder={placeholderText}
                  containerClassName="w-full"
                  className={cn(
                    "w-full px-4 py-3",
                    "resize-none bg-transparent border-none",
                    "text-text-main-white text-sm",
                    "focus:outline-none",
                    "placeholder:text-text-main-white/40",
                  )}
                  showRing={false}
                />
              </div>
 
              {/* Attachment badges */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    className="flex flex-wrap gap-2 px-4 pb-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {attachments.map((file) => (
                      <motion.div
                        key={file.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs border",
                          // ✅ FIX 2: Audio attachments get a distinct teal tint so users
                          //    can visually distinguish them from image/PDF badges.
                          file.type === "audio"
                            ? "bg-teal-500/10 text-teal-400/90 border-teal-500/20"
                            : "bg-brand-primary/10 text-brand-primary/90 border-brand-primary/20",
                        )}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        {/* Small icon hint for audio files */}
                        {file.type === "audio" && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="h-3 w-3 shrink-0">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                          </svg>
                        )}
                        <span className="truncate max-w-[160px]">{file.name}</span>
                        <button
                          onClick={() => onRemoveAttachment(file.id)}
                          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
 
              {/* Footer actions */}
              <div className="border-white/[0.08] flex items-center justify-between gap-4 border-t p-4">
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    whileTap={{ scale: 0.94 }}
                    className="text-text-main-white/60 hover:text-text-main-white rounded-lg p-2 transition-colors"
                    title="Attach files (PDF, image)"
                  >
                    <Paperclip className="h-4 w-4" />
                  </motion.button>
 
                  <motion.button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    whileTap={{ scale: 0.94 }}
                    className="text-text-main-white/60 hover:text-text-main-white rounded-lg p-2 transition-colors"
                    title="Capture picture"
                  >
                    <Camera className="h-4 w-4" />
                  </motion.button>
 
                  {/* ✅ FIX 2: Mic button now calls onCaptureAudio (speech-to-text) */}
                  <motion.button
                    type="button"
                    onClick={onCaptureAudio}
                    whileTap={{ scale: 0.94 }}
                    className="text-text-main-white/60 hover:text-text-main-white rounded-lg p-2 transition-colors"
                    title="Capture audio (speech-to-text)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="h-4 w-4">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </motion.button>
 
                  {commandSuggestions.length > 0 && (
                    <motion.button
                      type="button"
                      data-command-button
                      onClick={onToggleCommandPalette}
                      whileTap={{ scale: 0.94 }}
                      className={cn(
                        "text-text-main-white/60 hover:text-text-main-white rounded-lg p-2 transition-colors",
                        showCommandPalette && "bg-brand-primary/20 text-brand-primary",
                      )}
                    >
                      <Command className="h-4 w-4" />
                    </motion.button>
                  )}
 
                  {models.length > 0 && (
                    <div className="flex items-center gap-2 border-l border-white/[0.08] pl-3 ml-1">
                      <Globe className="h-4 w-4 text-text-main-white/40" />
                      <select
                        value={selectedModel}
                        onChange={(e) => onSelectModel(e.target.value)}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-text-main-white/70 focus:outline-none cursor-pointer"
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id} className="bg-dark-bg-main text-black">
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
 
                <motion.button
                  type="button"
                  onClick={onSend}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isGenerating || !value.trim()}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-bold transition-all",
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
              </div>
            </motion.div>
 
            {/* Quick-action chips */}
            {commandSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {commandSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.prefix}
                    onClick={() => onSelectCommand(suggestion.prefix + " ")}
                    className="bg-white/[0.02] text-text-main-white/60 hover:bg-white/[0.05] hover:text-text-main-white flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all border border-white/[0.08]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {suggestion.icon}
                    <span>{suggestion.label}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
 
        {/* Mouse spotlight */}
        {inputFocused && (
          <motion.div
            className="from-brand-primary via-brand-primary/80 to-brand-accent pointer-events-none fixed z-0 h-[50rem] w-[50rem] rounded-full bg-gradient-to-r opacity-[0.02] blur-[96px]"
            animate={{ x: mousePosition.x - 400, y: mousePosition.y - 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 150, mass: 0.5 }}
          />
        )}
      </div>
    </div>
  );
}
