import { useState, useEffect, useRef } from "react";
import type { ComponentType } from "react";
import {
  PenLine,
  Code2,
  CalendarDays,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * EmptyChatState
 * ----------------
 * Empty-state shown before the first message in an AI assistant chat UI.
 * A typewriter cursor cycles through example prompts over a faint dot-grid
 * canvas — "a blank page, ready to be written on" — followed by a grid of
 * suggestion cards.
 *
 * Usage:
 *   <EmptyChatState onSuggestionClick={(text) => sendMessage(text)} />
 *
 *   {messages.length === 0
 *     ? <EmptyChatState onSuggestionClick={handleSend} />
 *     : <MessageList messages={messages} />}
 */

export interface Suggestion {
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  /** Text sent when the card is clicked. Falls back to `title` if omitted. */
  prompt?: string;
}

export interface EmptyChatStateProps {
  /** Used only for the screen-reader-only status line. */
  assistantName?: string;
  /** Phrases the headline cycles through. */
  phrases?: string[];
  /** Cards shown below the headline. */
  suggestions?: Suggestion[];
  /** Called with the suggestion's `prompt` (or `title`) when a card is clicked. */
  onSuggestionClick?: (text: string) => void;
  /** Accent color used for the cursor, eyebrow dot, and card hover states. */
  accent?: string;
}

const DEFAULT_PHRASES: string[] = [
  "Ask me anything.",
  "Paste in a document.",
  "Brainstorm out loud.",
  "Debug some code.",
];

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    icon: PenLine,
    title: "Draft something",
    description: "A cover letter, an email, a first chapter",
    prompt: "Help me draft an email to a client explaining a project delay",
  },
  {
    icon: Code2,
    title: "Write or fix code",
    description: "Debug an error, build a feature, review a PR",
    prompt: "Help me debug why my React component keeps re-rendering",
  },
  {
    icon: CalendarDays,
    title: "Plan something",
    description: "A week, a trip, a project timeline",
    prompt: "Help me plan a realistic 4-week timeline for a side project",
  },
  {
    icon: BookOpen,
    title: "Understand something",
    description: "A concept, a paper, a decision you're weighing",
    prompt:
      "Explain how transformers work, assuming I know basic linear algebra",
  },
];

interface TypewriterOptions {
  typeSpeed?: number;
  deleteSpeed?: number;
  holdTime?: number;
  startDelay?: number;
}

type TypewriterPhase = "typing" | "deleting";

function useTypewriter(
  phrases: string[],
  {
    typeSpeed = 55,
    deleteSpeed = 28,
    holdTime = 1500,
    startDelay = 300,
  }: TypewriterOptions = {},
): string {
  const [text, setText] = useState<string>("");
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [phase, setPhase] = useState<TypewriterPhase>("typing");
  const reducedMotion = useRef<boolean>(
    typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (reducedMotion.current) {
      setText(phrases[0] ?? "");
      return;
    }
    const current = phrases[phraseIndex % phrases.length] ?? "";
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text.length < current.length) {
        timeout = setTimeout(
          () => setText(current.slice(0, text.length + 1)),
          typeSpeed,
        );
      } else {
        timeout = setTimeout(() => setPhase("deleting"), holdTime);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(
          () => setText(current.slice(0, text.length - 1)),
          deleteSpeed,
        );
      } else {
        setPhraseIndex((i) => (i + 1) % phrases.length);
        timeout = setTimeout(() => setPhase("typing"), startDelay);
      }
    }
    return () => clearTimeout(timeout);
  }, [
    text,
    phase,
    phraseIndex,
    phrases,
    typeSpeed,
    deleteSpeed,
    holdTime,
    startDelay,
  ]);

  return text;
}

export default function EmptyChatState({
  assistantName = "the assistant",
  phrases = DEFAULT_PHRASES,
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionClick = () => {},
  accent = "#1F6F62",
}: EmptyChatStateProps) {
  const typed = useTypewriter(phrases);
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => setMounted(true), []);

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
      {/* dot-grid canvas */}
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

      <div
        className="relative flex w-full max-w-xl flex-col items-center text-center transition-all duration-700 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {/* eyebrow */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 backdrop-blur-sm">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
          New conversation
        </div>

        {/* typewriter headline */}
        <div className="flex min-h-[2.75rem] items-center justify-center px-2">
          <p
            className="text-2xl leading-snug text-zinc-900 sm:text-3xl"
            style={{
              fontFamily: "'Iowan Old Style', 'Georgia', ui-serif, serif",
            }}
          >
            {typed}
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-[1.05em] w-[2.5px] translate-y-[3px] animate-[blink_1s_steps(1)_infinite] rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
          </p>
        </div>

        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
          Nothing here yet — type below, or start from one of these.
        </p>

        {/* suggestion cards */}
        <div className="mt-9 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {suggestions.map(({ icon: Icon, title, description, prompt }) => (
            <button
              key={title}
              type="button"
              onClick={() => onSuggestionClick(prompt ?? title)}
              className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/90 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ "--tw-ring-color": accent } as React.CSSProperties}
            >
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
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
                  <ArrowUpRight
                    size={14}
                    className="mt-0.5 shrink-0 text-zinc-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    style={{ color: "var(--accent)" }}
                  />
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only">
        Empty conversation with {assistantName}. No messages yet.
      </p>

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"].animate-\\[blink_1s_steps\\(1\\)_infinite\\] { animation: none !important; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
