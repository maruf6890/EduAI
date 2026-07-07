"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, FileText, X } from "lucide-react";

interface Props {
  open: boolean;
  submissionText: string;
  setSubmissionText: (v: string) => void;
  files: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  isSubmitting: boolean;
  isResubmit: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SubmitAssignmentDialog({
  open,
  submissionText,
  setSubmissionText,
  files,
  onFileChange,
  onRemoveFile,
  isSubmitting,
  isResubmit,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isResubmit ? "Resubmit assignment" : "Submit assignment"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="submission_text">Your answer</Label>
            <Textarea
              id="submission_text"
              rows={5}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Write your answer here..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Attach files</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground transition hover:border-[#8168f3] hover:text-[#8168f3]">
              <Paperclip className="h-4 w-4" />
              Add files
              <input type="file" multiple onChange={onFileChange} className="hidden" />
            </label>

            {files.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1.5">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(index)}
                      className="shrink-0 text-muted-foreground transition hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Provide an answer, at least one file, or both.
          </p>

          <DialogFooter className="mt-2 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={(!submissionText.trim() && files.length === 0) || isSubmitting}
              className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
            >
              {isSubmitting ? "Submitting..." : isResubmit ? "Resubmit" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}