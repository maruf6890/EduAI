"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Paperclip, FileText, X } from "lucide-react";
import { AssignmentFormState } from "./types";

interface Props {
  open: boolean;
  form: AssignmentFormState;
  setForm: React.Dispatch<React.SetStateAction<AssignmentFormState>>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export default function CreateAssignmentDialog({
  open,
  form,
  setForm,
  isSubmitting,
  onClose,
  onSubmit,
  onFileChange,
  onRemoveFile,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Photosynthesis Lab Report"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Instructions for students..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="total_marks">Total marks</Label>
              <Input
                id="total_marks"
                type="number"
                min={0}
                value={form.total_marks}
                onChange={(e) => setForm((p) => ({ ...p, total_marks: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="due_date">Due date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Attachments</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground transition hover:border-[#8168f3] hover:text-[#8168f3]">
              <Paperclip className="h-4 w-4" />
              Add files
              <input type="file" multiple onChange={onFileChange} className="hidden" />
            </label>

            {form.files.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1.5">
                {form.files.map((file, index) => (
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

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="late" className="cursor-pointer font-normal">
                Allow late submissions
              </Label>
              <Switch
                id="late"
                checked={form.allow_late_submission}
                onCheckedChange={(v) => setForm((p) => ({ ...p, allow_late_submission: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="publish" className="cursor-pointer font-normal">
                Publish immediately
              </Label>
              <Switch
                id="publish"
                checked={form.is_published}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_published: v }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-2 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.title || isSubmitting}
              className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}