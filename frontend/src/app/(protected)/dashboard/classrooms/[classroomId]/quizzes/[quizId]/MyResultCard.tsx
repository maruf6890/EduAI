import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { MyQuizResult } from "../types";
import { getSubmissionStatusBadge } from "../QuizHelpers";

export default function MyResultCard({ result, totalMarks }: { result: MyQuizResult; totalMarks: number }) {
  const badge = getSubmissionStatusBadge(result.status);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Your result</h3>
          <Badge variant="secondary" className={badge.className}>
            {badge.label}
          </Badge>
        </div>
        <p className="mt-2 text-2xl font-bold text-[#8168f3]">
          {result.marks_obtained ?? 0} <span className="text-base font-normal text-muted-foreground">/ {totalMarks}</span>
        </p>
      </div>

      {result.answers.length > 0 && (
        <div className="flex flex-col gap-3">
          {result.answers.map((a, index) => (
            <div key={a.question_id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {index + 1}. {a.question_text}
                </p>
                {a.is_correct ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Your answer: <span className="font-medium text-foreground">{a.selected_option ?? "—"}</span>
                </span>
                {!a.is_correct && (
                  <span>
                    Correct answer: <span className="font-medium text-green-600 dark:text-green-400">{a.correct_option}</span>
                  </span>
                )}
                <span>{a.marks} {a.marks === 1 ? "mark" : "marks"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}