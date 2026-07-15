import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  PenLine,
  Code2,
  CalendarDays,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

export interface Suggestion {
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  prompt?: string;
}

export interface EmptyChatStateProps {
  assistantName?: string;
  phrases?: string[];
  suggestions?: Suggestion[];
  onSuggestionClick?: (text: string) => void;
  accent?: string;
}

const DEFAULT_PHRASES: string[] = [
  "Ask me anything.",
  "Create Study Plan.",
  "Discuss a from resource.",
  "Your own study buddy.",
];

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    icon: PenLine,
    title: "Create Practice Quiz",
    description: "Generate a practice quiz based on your materials, books, or resources",
    prompt: "Generate quiz on rag",
  },
  {
    icon: Code2,
    title: "Create study plan",
    description: "create your own study plan, or a learning path for a topic",
    prompt: "react learning plan",
  },
  {
    icon: CalendarDays,
    title: "View a timeline",
    description: "Your Scheduled tasks,reminders,calendar events",
    prompt: "Show me all my events",
  },
  {
    icon: BookOpen,
    title: "Understand something",
    description: "Discuss Topics from your materials, books, or resources",
    prompt:
      "Explain how rag works",
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1]  as const},
  },
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
  hover: {
    y: -3,
    boxShadow: "0 8px 20px -8px rgba(0,0,0,0.15)",
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const arrowVariants = {
  hidden: { opacity: 0, x: -2, y: 2 },
  visible: { opacity: 0, x: -2, y: 2 },
  hover: { opacity: 1, x: 0, y: 0, transition: { duration: 0.2 } },
};

const phraseVariants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function EmptyChatState({
  assistantName = "the assistant",
  phrases = DEFAULT_PHRASES,
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionClick = (message: string) => {},
  accent = "#1F6F62",
}: EmptyChatStateProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || phrases.length <= 1) return;
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }, 2600);
    return () => clearInterval(interval);
  }, [phrases, reducedMotion]);

  const currentPhrase = phrases[phraseIndex % phrases.length] ?? "";

  return (
    <div
      className="relative flex h-full min-h-[520px] w-full items-center justify-center overflow-hidden px-6 py-16"
      style={
        {
          "--accent": accent,
          "--accent-tint": `${accent}14`,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          color: "#D4D4D8",
          maskImage:
            "radial-gradient(ellipse 60% 55% at 50% 40%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 55% at 50% 40%, black 0%, transparent 75%)",
        }}
      />

      <motion.div
        className="relative flex w-full max-w-xl flex-col items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 backdrop-blur-sm">
          <motion.span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
            animate={reducedMotion ? undefined : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          New conversation
        </div>

        <div className="flex min-h-[2.75rem] items-center justify-center px-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPhrase}
              className="text-2xl leading-snug text-zinc-900 sm:text-3xl"
              style={{
                fontFamily: "'Iowan Old Style', 'Georgia', ui-serif, serif",
              }}
              variants={phraseVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentPhrase}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
          Nothing here yet — type below, or start from one of these.
        </p>

        <motion.div
          className="mt-9 grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {suggestions.map(({ icon: Icon, title, description, prompt }) => (
            <motion.button
              key={title}
              type="button"
              onClick={() => onSuggestionClick(prompt ?? title)}
              className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/90 p-4 text-left shadow-sm backdrop-blur-sm hover:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ "--tw-ring-color": accent } as React.CSSProperties}
              variants={cardVariants}
              whileHover="hover"
              whileTap={{ y: 0 }}
            >
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: "var(--accent-tint)",
                  color: "var(--accent)",
                }}
              >
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900">
                    {title}
                  </span>
                  <motion.span
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--accent)" }}
                    variants={arrowVariants}
                  >
                    <ArrowUpRight size={14} />
                  </motion.span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                  {description}
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      <p className="sr-only">
        Empty conversation with {assistantName}. No messages yet.
      </p>
    </div>
  );
}
