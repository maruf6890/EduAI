"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { QuizQuestion, QuestionFormState, emptyQuestion } from "../types";

interface Props {
  open: boolean;
  existingQuestions: QuizQuestion[];
  newQuestions: QuestionFormState[];
  setNewQuestions: React.Dispatch<React.SetStateAction<QuestionFormState[]>>;
  isSubmitting: boolean;
  isDeletingId: number | null;
  onClose: () => void;
  onAddQuestions: (e: React.FormEvent) => void;
  onDeleteQuestion: (questionId: number) => void;
}

export default function ManageQuestionsDialog({
  open,
  existingQuestions,
  newQuestions,
  setNewQuestions,
  isSubmitting,
  isDeletingId,
  onClose,
  onAddQuestions,
  onDeleteQuestion,
}: Props) {
  function addRow() {
    setNewQuestions((prev) => [
      ...prev,
      { ...emptyQuestion, order_index: existingQuestions.length + prev.length + 1 },
    ]);
  }

  function removeRow(index: number) {
    setNewQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof QuestionFormState, value: string) {
    setNewQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage questions</DialogTitle>
        </DialogHeader>

        {/* Existing questions */}
        {existingQuestions.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold">
              Existing questions ({existingQuestions.length})
            </Label>
            {existingQuestions.map((q, i) => (
              <div
                key={q.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {i + 1}. {q.question_text}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Correct: {q.correct_option} · {q.marks} {q.marks === 1 ? "mark" : "marks"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteQuestion(q.id)}
                  disabled={isDeletingId === q.id}
                  className="shrink-0 text-muted-foreground transition hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Add new questions */}
        <form onSubmit={onAddQuestions} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Add new questions</Label>
            <Button type="button" size="sm" variant="outline" onClick={addRow} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add question
            </Button>
          </div>

          {newQuestions.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              Click &quot;Add question&quot; to add a new question.
            </p>
          )}

          {newQuestions.map((q, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">New question {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-muted-foreground transition hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <Input
                value={q.question_text}
                onChange={(e) => updateRow(index, "question_text", e.target.value)}
                placeholder="Question text"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  value={q.option_a}
                  onChange={(e) => updateRow(index, "option_a", e.target.value)}
                  placeholder="Option A"
                />
                <Input
                  value={q.option_b}
                  onChange={(e) => updateRow(index, "option_b", e.target.value)}
                  placeholder="Option B"
                />
                <Input
                  value={q.option_c}
                  onChange={(e) => updateRow(index, "option_c", e.target.value)}
                  placeholder="Option C (optional)"
                />
                <Input
                  value={q.option_d}
                  onChange={(e) => updateRow(index, "option_d", e.target.value)}
                  placeholder="Option D (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-normal text-muted-foreground">Correct option</Label>
                  <select
                    value={q.correct_option}
                    onChange={(e) => updateRow(index, "correct_option", e.target.value)}
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
                    onChange={(e) => updateRow(index, "marks", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <DialogFooter className="mt-2 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {newQuestions.length > 0 && (
              <Button
                type="submit"
                disabled={isSubmitting || newQuestions.some((q) => !q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim())}
                className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
              >
                {isSubmitting ? "Saving..." : "Save questions"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}