"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { TakeQuizData } from "../types";

interface Props {
  data: TakeQuizData;
  isSubmitting: boolean;
  onSubmit: (answers: { question_id: number; selected_option: string }[]) => void;
}

export default function TakeQuizView({ data, isSubmitting, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(data.duration_minutes * 60);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const buildAnswerList = useCallback(() => {
    return Object.entries(answers).map(([question_id, selected_option]) => ({
      question_id: Number(question_id),
      selected_option,
    }));
  }, [answers]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!autoSubmitted) {
        setAutoSubmitted(true);
        onSubmit(buildAnswerList());
      }
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, autoSubmitted]);

  function selectOption(questionId: number, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function handleManualSubmit() {
    onSubmit(buildAnswerList());
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLowTime = secondsLeft <= 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Sticky timer bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
        <span className="text-sm text-muted-foreground">
          {answeredCount} / {data.questions.length} answered
        </span>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
            isLowTime
              ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
              : "bg-[#8168f3]/10 text-[#8168f3]"
          }`}
        >
          <Clock className="h-4 w-4" />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Questions */}
      {data.questions.map((q, index) => (
        <div key={q.id} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">
            {index + 1}. {q.question_text}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({q.marks} {q.marks === 1 ? "mark" : "marks"})
            </span>
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const optionText = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }[opt];
              if (!optionText) return null;
              const isSelected = answers[q.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => selectOption(q.id, opt)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "border-[#8168f3] bg-[#8168f3]/10 text-foreground"
                      : "border-border hover:border-[#8168f3]/40 hover:bg-muted/30"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      isSelected ? "border-[#8168f3] bg-[#8168f3] text-white" : "border-border text-muted-foreground"
                    }`}
                  >
                    {opt}
                  </span>
                  {optionText}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        onClick={handleManualSubmit}
        disabled={isSubmitting}
        className="w-full bg-[#8168f3] text-white hover:bg-[#6f57e0] sm:w-auto sm:self-end"
      >
        {isSubmitting ? "Submitting..." : "Submit quiz"}
      </Button>
    </div>
  );
}