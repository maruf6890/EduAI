import { X, Paperclip, FileText } from "lucide-react";
import { AssignmentFormState } from "./types";
import ToggleSwitch from "./ToggleSwitch";

interface Props {
  form: AssignmentFormState;
  setForm: React.Dispatch<React.SetStateAction<AssignmentFormState>>;
  isSubmitting: boolean;
  isEditing?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export default function CreateAssignmentModal({
  form,
  setForm,
  isSubmitting,
  isEditing = false,
  onClose,
  onSubmit,
  onFileChange,
  onRemoveFile,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col rounded-t-[20px] border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 sm:max-w-lg sm:rounded-[20px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit assignment" : "Create assignment"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4">

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Photosynthesis Lab Report"
                className="w-full rounded-[12px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#8168f3] focus:outline-none focus:ring-2 focus:ring-[#8168f3]/20 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Instructions for students..."
                rows={3}
                className="w-full resize-none rounded-[12px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#8168f3] focus:outline-none focus:ring-2 focus:ring-[#8168f3]/20 transition"
              />
            </div>

            {/* Total marks + Due date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Total marks
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.total_marks}
                  onChange={(e) => setForm((prev) => ({ ...prev, total_marks: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-[12px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8168f3] focus:outline-none focus:ring-2 focus:ring-[#8168f3]/20 transition"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Due date
                </label>
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="w-full rounded-[12px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:border-[#8168f3] focus:outline-none focus:ring-2 focus:ring-[#8168f3]/20 transition"
                />
              </div>
            </div>

            {/* Files — only on create */}
            {!isEditing && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Attachments
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-gray-200 dark:border-white/10 px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hover:border-[#8168f3] hover:text-[#8168f3] transition">
                  <Paperclip className="h-4 w-4" />
                  Add files
                  <input type="file" multiple onChange={onFileChange} className="hidden" />
                </label>

                {form.files.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {form.files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-[8px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveFile(index)}
                          className="ml-2 shrink-0 text-gray-400 hover:text-red-500 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Toggles */}
            <div className="flex flex-col gap-3 rounded-[12px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow late submissions</span>
                <ToggleSwitch
                  checked={form.allow_late_submission}
                  onChange={(checked) => setForm((prev) => ({ ...prev, allow_late_submission: checked }))}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                <ToggleSwitch
                  checked={form.is_published}
                  onChange={(checked) => setForm((prev) => ({ ...prev, is_published: checked }))}
                />
              </label>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!form.title || isSubmitting}
            className="rounded-[12px] bg-[#8168f3] hover:bg-[#6f57e0] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition"
          >
            {isSubmitting
              ? isEditing ? "Saving..." : "Creating..."
              : isEditing ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}