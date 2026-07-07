import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { QuizResultRow } from "../types";
import { formatDateTime, getSubmissionStatusBadge } from "../QuizHelpers";

export default function QuizResultsPanel({
  results,
  totalMarks,
}: {
  results: QuizResultRow[];
  totalMarks: number;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8168f3]/10">
          <Users className="h-5 w-5 text-[#8168f3]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No attempts yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Results will appear here once students take the quiz.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {results.map((r) => {
        const badge = getSubmissionStatusBadge(r.status);
        return (
          <div
            key={r.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8168f3] text-sm font-bold text-white">
                {r.student.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{r.student.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.student.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Submitted {formatDateTime(r.submitted_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:shrink-0">
              <Badge variant="secondary" className={badge.className}>
                {badge.label}
              </Badge>
              <span className="text-sm font-semibold text-foreground">
                {r.marks_obtained ?? 0} / {totalMarks}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}