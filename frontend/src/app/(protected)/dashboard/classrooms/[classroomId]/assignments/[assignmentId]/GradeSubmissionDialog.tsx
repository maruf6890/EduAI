"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AssignmentFilesList from "./AssignmentFilesList";
import { SubmissionWithStudent } from "../types";

interface Props {
  open: boolean;
  submission: SubmissionWithStudent | null;
  totalMarks: number | null;
  marksObtained: string;
  setMarksObtained: (v: string) => void;
  feedback: string;
  setFeedback: (v: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function GradeSubmissionDialog({
  open,
  submission,
  totalMarks,
  marksObtained,
  setMarksObtained,
  feedback,
  setFeedback,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-sm font-semibold text-foreground">{submission.student.full_name}</p>
          <p className="text-xs text-muted-foreground">{submission.student.email}</p>
        </div>

        {submission.submission_text && (
          <p className="whitespace-pre-wrap rounded-lg border border-border p-3 text-sm text-foreground">
            {submission.submission_text}
          </p>
        )}

        {submission.files.length > 0 && <AssignmentFilesList files={submission.files} />}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marks_obtained">
              Marks {totalMarks ? `(out of ${totalMarks})` : ""} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="marks_obtained"
              type="number"
              min={0}
              max={totalMarks ?? undefined}
              step="0.01"
              required
              value={marksObtained}
              onChange={(e) => setMarksObtained(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback for the student..."
            />
          </div>

          <DialogFooter className="mt-2 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!marksObtained || isSubmitting}
              className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
            >
              {isSubmitting ? "Saving..." : "Save grade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}