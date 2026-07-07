import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { Submission } from "../types";
import { formatDateTime, getStatusBadge } from "../AssignmentHelpers";
import AssignmentFilesList from "./AssignmentFilesList";

export default function MySubmissionCard({
  submission,
  totalMarks,
  canResubmit,
  onResubmit,
}: {
  submission: Submission;
  totalMarks: number | null;
  canResubmit: boolean;
  onResubmit: () => void;
}) {
  const badge = getStatusBadge(submission.status);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Your submission</h3>
        <Badge variant="secondary" className={badge.className}>
          {badge.label}
        </Badge>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Submitted {formatDateTime(submission.submitted_at)}
      </p>

      {submission.submission_text && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-sm text-foreground">
          {submission.submission_text}
        </p>
      )}

      {submission.files.length > 0 && (
        <div className="mt-4">
          <AssignmentFilesList files={submission.files} />
        </div>
      )}

      {submission.status === "GRADED" && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-foreground">
              {submission.marks_obtained} {totalMarks ? `/ ${totalMarks}` : ""} points
            </span>
          </div>
          {submission.feedback && (
            <div className="mt-3 flex gap-2 rounded-lg bg-muted/30 p-3">
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-foreground">{submission.feedback}</p>
            </div>
          )}
        </>
      )}

      {canResubmit && (
        <Button
          variant="outline"
          onClick={onResubmit}
          className="mt-4 w-full sm:w-auto"
        >
          Resubmit
        </Button>
      )}
    </div>
  );
}