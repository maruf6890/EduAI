import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { SubmissionWithStudent } from "../types";
import { formatDateTime, getStatusBadge } from "../AssignmentHelpers";

export default function TeacherSubmissionsPanel({
  submissions,
  totalMarks,
  onGrade,
}: {
  submissions: SubmissionWithStudent[];
  totalMarks: number | null;
  onGrade: (submission: SubmissionWithStudent) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8168f3]/10">
          <Users className="h-5 w-5 text-[#8168f3]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No submissions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Student submissions will appear here once they submit.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((submission) => {
        const badge = getStatusBadge(submission.status);
        return (
          <div
            key={submission.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8168f3] text-sm font-bold text-white">
                {submission.student.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {submission.student.full_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{submission.student.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Submitted {formatDateTime(submission.submitted_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:shrink-0">
              <Badge variant="secondary" className={badge.className}>
                {badge.label}
              </Badge>

              {submission.status === "GRADED" ? (
                <span className="text-sm font-semibold text-foreground">
                  {submission.marks_obtained}{totalMarks ? ` / ${totalMarks}` : ""}
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onGrade(submission)}
                  className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
                >
                  Grade
                </Button>
              )}

              {submission.status === "GRADED" && (
                <Button size="sm" variant="outline" onClick={() => onGrade(submission)}>
                  Edit grade
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}