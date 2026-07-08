import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Visibility } from "@/lib/types/classrooms";
import { Globe2, Loader2, Lock } from "lucide-react";
import { useState } from "react";

export default function MaterialModal({
  mode,
  initialTitle,
  initialDescription,
  initialVisibility,
  allowCentral,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialTitle: string;
  initialDescription: string;
  initialVisibility: Visibility;
  allowCentral: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    description: string,
    visibility: Visibility,
    file: File | null,
  ) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 0 && (mode === "edit" || file !== null);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    await onSubmit(title.trim(), description.trim(), visibility, file);
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border bg-white  p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-text-main">
            {mode === "create" ? "Add material" : "Edit material"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-sm border bg-bg-main px-3 py-2 text-sm text-text-main outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="rounded-sm border bg-bg-main px-3 py-2 text-sm text-text-main outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          />

          {/* Visibility and file are only set at upload time — the backend
              doesn't support changing either after the fact. */}
          {mode === "create" && (
            <>
              <div className="flex gap-2">
                {allowCentral && (
                  <button
                    type="button"
                    onClick={() => setVisibility("CENTRAL")}
                    className={`flex-1 rounded-sm border px-3 py-2 text-xs font-medium transition-colors ${
                      visibility === "CENTRAL"
                        ? "border-brand-primary/40 bg-brand-primary/20 text-brand-primary"
                        : "text-zinc-500 hover:text-text-main"
                    }`}
                  >
                    <Globe2 className="mr-1 inline h-3.5 w-3.5" />
                    Central
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setVisibility("PRIVATE")}
                  className={`flex-1 rounded-sm border px-3 py-2 text-xs font-medium transition-colors ${
                    visibility === "PRIVATE"
                      ? "border-brand-primary/40 bg-brand-primary/20 text-brand-primary"
                      : "text-zinc-500 hover:text-text-main"
                  }`}
                >
                  <Lock className="mr-1 inline h-3.5 w-3.5" />
                  Private (only me)
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="material-file-input"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-zinc-500 file:mr-3 file:rounded-sm file:border-0 file:bg-brand-primary/20 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-primary"
                />
                {file && (
                  <span
                    className="truncate text-xs text-zinc-500 "
                    title={file.name}
                  >
                    {file.name.length > 5 ? `${file.name.slice(0, 5)}...` : file.name}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-sm bg-transparent text-zinc-500 hover:text-text-main"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="gap-2 rounded-sm bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "create" ? "Upload" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
