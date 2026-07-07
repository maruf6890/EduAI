"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AssignmentFormState } from "./types";

interface Props {
  open: boolean;
  form: AssignmentFormState;
  setForm: React.Dispatch<React.SetStateAction<AssignmentFormState>>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditAssignmentDialog({
  open,
  form,
  setForm,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit_title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit_title"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit_total_marks">Total marks</Label>
              <Input
                id="edit_total_marks"
                type="number"
                min={0}
                value={form.total_marks}
                onChange={(e) => setForm((p) => ({ ...p, total_marks: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit_due_date">Due date</Label>
              <Input
                id="edit_due_date"
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-sm border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit_late" className="cursor-pointer font-normal">
                Allow late submissions
              </Label>
              <Switch
                id="edit_late"
                checked={form.allow_late_submission}
                onCheckedChange={(v) => setForm((p) => ({ ...p, allow_late_submission: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit_publish" className="cursor-pointer font-normal">
                Published
              </Label>
              <Switch
                id="edit_publish"
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
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}