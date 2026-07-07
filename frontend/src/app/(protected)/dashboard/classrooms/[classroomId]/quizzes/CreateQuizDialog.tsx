"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { QuestionFormState, QuizFormState, emptyQuestion } from "./types";

interface Props {
  open: boolean;
  form: QuizFormState;
  setForm: React.Dispatch<React.SetStateAction<QuizFormState>>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreateQuizDialog({ open, form, setForm, isSubmitting, onClose, onSubmit }: Props) {
  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...emptyQuestion, order_index: prev.questions.length + 1 }],
    }));
  }

  function removeQuestion(index: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function updateQuestion(index: number, field: keyof QuestionFormState, value: string) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  }

  const isValid =
    form.title.trim() &&
    form.questions.length > 0 &&
    form.questions.every((q) => q.question_text.trim() && q.option_a.trim() && q.option_b.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create quiz</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Mid Term Quiz"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What does this quiz cover?"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scheduled_at">Scheduled date</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min={1}
                value={form.duration_minutes}
                onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <Label htmlFor="publish" className="cursor-pointer font-normal">
              Publish immediately (visible to students)
            </Label>
            <Switch
              id="publish"
              checked={form.is_published}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_published: v }))}
            />
          </div>

          <Separator />

          {/* Questions builder */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Questions {form.questions.length > 0 && `(${form.questions.length})`}
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={addQuestion} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add question
              </Button>
            </div>

            {form.questions.length === 0 && (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                No questions added yet. Click &quot;Add question&quot; to start.
              </p>
            )}

            {form.questions.map((q, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Question {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-muted-foreground transition hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Input
                  value={q.question_text}
                  onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                  placeholder="Question text"
                  required
                />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={q.option_a}
                    onChange={(e) => updateQuestion(index, "option_a", e.target.value)}
                    placeholder="Option A"
                    required
                  />
                  <Input
                    value={q.option_b}
                    onChange={(e) => updateQuestion(index, "option_b", e.target.value)}
                    placeholder="Option B"
                    required
                  />
                  <Input
                    value={q.option_c}
                    onChange={(e) => updateQuestion(index, "option_c", e.target.value)}
                    placeholder="Option C (optional)"
                  />
                  <Input
                    value={q.option_d}
                    onChange={(e) => updateQuestion(index, "option_d", e.target.value)}
                    placeholder="Option D (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-normal text-muted-foreground">Correct option</Label>
                    <select
                      value={q.correct_option}
                      onChange={(e) => updateQuestion(index, "correct_option", e.target.value)}
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-normal text-muted-foreground">Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => updateQuestion(index, "marks", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
            >
              {isSubmitting ? "Creating..." : "Create quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}