"use client";

import React, { useRef, useState } from "react";
import { Image as ImageIcon, Paperclip, Link2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AnnouncementModalProps {
  className: string;
  onClose: () => void;
  // returns title + content + real Files so the parent can build FormData
  onPost: (title: string, content: string, files: File[]) => void;
  mode?: "create" | "edit";
  initialTitle?: string;
  initialContent?: string;
}

type AttachmentType = "image" | "file" | "link";

interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  url?: string;
  file?: File;
}

function createAttachmentId(type: AttachmentType) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AnnouncementModal({
  onClose,
  onPost,
  className,
  mode = "create",
  initialTitle = "",
  initialContent = "",
}: AnnouncementModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialContent);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasTitle = title.trim().length > 0;

  const resetAndClose = () => {
    // Revoke any object URLs we created so we don't leak memory.
    attachments.forEach((a) => {
      if (a.url && a.type !== "link") URL.revokeObjectURL(a.url);
    });
    setTitle("");
    setText("");
    setAttachments([]);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const handlePost = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const files = attachments
      .filter((a): a is Attachment & { file: File } => Boolean(a.file))
      .map((a) => a.file);

    onPost(trimmedTitle, text.trim(), files);
    resetAndClose();
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: AttachmentType,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: createAttachmentId(type),
      type,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    event.target.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.url && target.type !== "link") {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleInsertLink = () => {
    const url = linkInputValue.trim();
    if (!url) return;

    setAttachments((prev) => [
      ...prev,
      { id: createAttachmentId("link"), type: "link", name: url, url },
    ]);
    setLinkInputValue("");
    setIsLinkDialogOpen(false);
  };

  const attachmentIcon = (type: AttachmentType) => {
    if (type === "image") return <ImageIcon size={13} className="shrink-0" />;
    if (type === "file") return <Paperclip size={13} className="shrink-0" />;
    return <Link2 size={13} className="shrink-0" />;
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg !max-w-2xl p-0 gap-0 overflow-hidden border border-surface-border bg-background rounded-sm shadow-xl"
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between space-y-0 px-6 py-4">
          <DialogTitle className="text-sm font-medium text-text-secondary">
            {mode === "edit" ? "Edit announcement" : "New announcement"}
          </DialogTitle>
          <button
            onClick={resetAndClose}
            aria-label="Close"
            className="rounded-full p-1 text-text-secondary/70 transition-colors hover:bg-bg-main hover:text-text-main"
          >
            <X size={16} />
          </button>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 pb-2 space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="focus-visible:ring-0 rounded-sm"
          />

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Share something with ${className}`}
            rows={1}
            className="min-h-[200px] h-[200px] focus-visible:ring-0 rounded-sm"
          />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3">
              {attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="group flex max-w-[220px] items-center gap-1.5 rounded-md border border-surface-border bg-bg-main py-1 pl-1.5 pr-1 text-xs text-text-main"
                >
                  {attachment.type === "image" && attachment.url ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="h-6 w-6 shrink-0 rounded object-cover"
                    />
                  ) : (
                    attachmentIcon(attachment.type)
                  )}
                  <span className="truncate">{attachment.name}</span>
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    aria-label={`Remove ${attachment.name}`}
                    className="shrink-0 rounded-full p-0.5 text-text-secondary hover:bg-surface-border/60 hover:text-text-main"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, "image")}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, "file")}
        />

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
          <div className="relative flex items-center gap-0.5">
            <button
              onClick={() => imageInputRef.current?.click()}
              title="Add image"
              aria-label="Add image"
              className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-main hover:text-text-main"
            >
              <ImageIcon size={17} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              aria-label="Attach file"
              className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-main hover:text-text-main"
            >
              <Paperclip size={17} />
            </button>

            {isLinkDialogOpen && (
              <div className="absolute bottom-full left-0 z-10 mb-2 w-72 rounded-xl border border-surface-border bg-bg-card p-3 shadow-lg">
                <Input
                  autoFocus
                  type="url"
                  value={linkInputValue}
                  onChange={(e) => setLinkInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInsertLink();
                  }}
                  placeholder="Paste a link"
                  className="border-surface-border bg-bg-main text-sm text-text-main focus-visible:ring-1 focus-visible:ring-brand-primary"
                />
                <div className="mt-2 flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsLinkDialogOpen(false);
                      setLinkInputValue("");
                    }}
                    className="h-7 px-2 text-xs text-text-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInsertLink}
                    disabled={!linkInputValue.trim()}
                    className="h-7 bg-brand-primary px-3 text-xs text-white hover:bg-brand-primary/90"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={resetAndClose}
              className="h-8 px-3 text-sm text-text-secondary hover:bg-bg-main hover:text-text-main"
            >
              Cancel
            </Button>
            <Button
              disabled={!hasTitle}
              onClick={handlePost}
              className="h-8 bg-brand-primary px-4 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:bg-surface-border disabled:text-text-secondary"
            >
              {mode === "edit" ? "Save" : "Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
