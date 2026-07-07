import { CheckCircle2 } from "lucide-react";
import { StudentSubmissionSummary } from "./types";

export default function MySubmissionsSummary({ submissions }: { submissions: StudentSubmissionSummary[] }) {
  if (submissions.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Your quiz results</h2>
      <div className="flex flex-col gap-2">
        {submissions.map((s) => (
          <div
            key={s.submission_id}
            className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="truncate text-foreground">{s.title}</span>
            {s.marks_obtained !== null ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-[#8168f3]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {s.marks_obtained} / {s.total_marks}
              </span>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">In progress</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}