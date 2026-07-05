"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Image as ImageIcon,
    Upload,
    Link2,
    Bold,
    Italic,
    Underline,
    List,
    RemoveFormatting,
    ChevronDown,
    Users,
    X,
    FileText,
} from "lucide-react";

interface AnnouncementModalProps {
    className: string;
    onClose: () => void;
    // now returns title + content + real Files so the parent can build FormData
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
    file?: File; // present for "image" | "file", absent for "link"
}

type FormattingAction = "bold" | "italic" | "underline" | "list" | "clear";

const FORMATTING_BUTTONS: { action: FormattingAction; label: string; Icon: typeof Bold }[] = [
    { action: "bold", label: "Bold", Icon: Bold },
    { action: "italic", label: "Italic", Icon: Italic },
    { action: "underline", label: "Underline", Icon: Underline },
    { action: "list", label: "Bulleted list", Icon: List },
    { action: "clear", label: "Clear formatting", Icon: RemoveFormatting },
];

export default function AnnouncementModal({
    onClose,
    onPost,
    className,
    mode = "create",
    initialTitle = "",
    initialContent = "",
}: AnnouncementModalProps) {
    const [title, setTitle] = useState<string>("");
    const [text, setText] = useState<string>("");

    // console.log({
    //     mode,
    //     title,
    //     hasTitle,
    //     isPostMenuOpen,
    // });
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isPostMenuOpen, setIsPostMenuOpen] = useState<boolean>(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState<boolean>(false);
    const [linkInputValue, setLinkInputValue] = useState<string>("");
    const [activeTooltip, setActiveTooltip] = useState<FormattingAction | null>(null);

    const modalRef = useRef<HTMLDivElement | null>(null);
    const titleInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const postMenuRef = useRef<HTMLDivElement | null>(null);
    const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // title is the required field per the API, content is optional
    const hasTitle = title.trim().length > 0;

    useEffect(() => {
        titleInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            if (
                postMenuRef.current &&
                !postMenuRef.current.contains(event.target as Node)
            ) {
                setIsPostMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, []);

    useEffect(() => {
        return () => {
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }
        };
    }, []);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    };

    const handleCancel = () => {
        setTitle("");
        setText("");
        handleClose();
    };

    const handlePost = () => {
        console.log("POST BUTTON CLICKED");
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const content = text.trim();
        const files = attachments
            .filter((a): a is Attachment & { file: File } => Boolean(a.file))
            .map((a) => a.file);

        onPost(trimmedTitle, content, files);

        setTitle("");
        setText("");
        setAttachments([]);
        setIsPostMenuOpen(false);
        handleClose();

    };


    const handleFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>,
        type: AttachmentType,
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const newAttachments: Attachment[] = Array.from(files).map((file) => ({
            id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
            const target = prev.find((attachment) => attachment.id === id);
            if (target?.url && target.type !== "link") {
                URL.revokeObjectURL(target.url);
            }
            return prev.filter((attachment) => attachment.id !== id);
        });
    };

    const handleInsertLink = () => {
        const url = linkInputValue.trim();
        if (!url) return;

        const newAttachment: Attachment = {
            id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: "link",
            name: url,
            url,
        };

        setAttachments((prev) => [...prev, newAttachment]);
        setLinkInputValue("");
        setIsLinkDialogOpen(false);
    };

    const handleFormattingClick = (action: FormattingAction) => {
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
        setActiveTooltip(action);
        tooltipTimeoutRef.current = setTimeout(() => {
            setActiveTooltip(null);
        }, 1500);
    };

    return (
        <div
            className="fixed inset-0 bg-bg-main/40 flex items-center justify-center z-50 p-4"
            onMouseDown={handleOverlayClick}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Create announcement"
                className="bg-bg-main border border-border-main/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-border-main/80">
                    <h2 className="text-2xl text-text-main">
                        {mode === "edit" ? "Edit announcement" : "Announcement"}
                    </h2>
                    <button
                        onClick={handleClose}
                        aria-label="Close"
                        className="p-2 rounded-full hover:bg-bg-main text-text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* For */}
                <div className="px-7 pt-5">
                    <p className="text-sm text-text-secondary mb-2">For</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button className="flex items-center gap-2 bg-bg-main border border-surface-border rounded-md px-4 py-2.5 text-sm text-text-main shadow-sm hover:shadow-md transition-shadow">
                            {className}
                            <ChevronDown size={16} className="text-text-secondary" />
                        </button>
                        <button className="flex items-center gap-2 border border-brand-primary rounded-full px-4 py-2 text-brand-primary text-sm font-medium hover:bg-brand-primary/10 transition-colors">
                            <Users size={16} />
                            All students
                        </button>
                    </div>
                </div>

                {/* Title — required by the API */}
                <div className="px-7 pt-5">
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full bg-transparent outline-none border-b border-surface-border pb-2 text-lg font-medium text-text-main placeholder:text-brand-primary/70"
                    />
                </div>

                {/* Textarea + formatting + attachment chips */}
                <div className="px-7 pt-5">
                    <div className="bg-bg-main rounded-md border-b-2 border-brand-primary min-h-[140px] px-5 py-4">
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Announce something to your class"
                            rows={4}
                            className="w-full bg-transparent outline-none resize-none placeholder:text-brand-primary/70 text-text-main text-base"
                        />

                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-3">
                                {attachments.map((attachment) => (
                                    <span
                                        key={attachment.id}
                                        className="flex items-center gap-1.5 bg-bg-card border border-surface-border rounded-full pl-3 pr-1.5 py-1 text-xs text-text-main max-w-[220px]"
                                    >
                                        {attachment.type === "image" && <ImageIcon size={12} className="shrink-0" />}
                                        {attachment.type === "file" && <FileText size={12} className="shrink-0" />}
                                        {attachment.type === "link" && <Link2 size={12} className="shrink-0" />}
                                        <span className="truncate">{attachment.name}</span>
                                        <button
                                            onClick={() => handleRemoveAttachment(attachment.id)}
                                            aria-label={`Remove ${attachment.name}`}
                                            className="p-0.5 rounded-full hover:bg-bg-main text-text-secondary shrink-0"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-1 pt-3 text-text-secondary">
                            {FORMATTING_BUTTONS.map(({ action, label, Icon }) => (
                                <div key={action} className="relative">
                                    <button
                                        onClick={() => handleFormattingClick(action)}
                                        aria-label={label}
                                        className="p-2 rounded hover:bg-bg-card transition-colors"
                                    >
                                        <Icon size={16} />
                                    </button>
                                    {activeTooltip === action && (
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-bg-main border border-surface-border text-text-main text-xs px-2 py-1 rounded shadow-lg">
                                            Coming soon
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
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
                <div className="flex items-center justify-between px-7 py-5">
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            className="p-2.5 rounded-full border border-surface-border text-text-secondary hover:bg-bg-main transition-colors"
                            title="Insert image"
                            aria-label="Insert image"
                        >
                            <ImageIcon size={18} />
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 rounded-full border border-surface-border text-text-secondary hover:bg-bg-main transition-colors"
                            title="Upload file"
                            aria-label="Upload file"
                        >
                            <Upload size={18} />
                        </button>
                        <button
                            onClick={() => setIsLinkDialogOpen((open) => !open)}
                            className="p-2.5 rounded-full border border-surface-border text-text-secondary hover:bg-bg-main transition-colors"
                            title="Add link"
                            aria-label="Add link"
                        >
                            <Link2 size={18} />
                        </button>

                        {isLinkDialogOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-72 bg-bg-card border border-surface-border rounded-lg shadow-xl p-3 z-10">
                                <label htmlFor="announcement-link-input" className="text-xs text-text-secondary mb-1 block">
                                    Add a link
                                </label>
                                <input
                                    id="announcement-link-input"
                                    type="url"
                                    autoFocus
                                    value={linkInputValue}
                                    onChange={(e) => setLinkInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleInsertLink();
                                    }}
                                    placeholder="https://example.com"
                                    className="w-full bg-bg-main border border-surface-border rounded px-2.5 py-1.5 text-sm text-text-main outline-none focus:border-brand-primary"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            setIsLinkDialogOpen(false);
                                            setLinkInputValue("");
                                        }}
                                        className="text-xs text-text-secondary px-2 py-1 rounded hover:bg-bg-main"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInsertLink}
                                        disabled={!linkInputValue.trim()}
                                        className="text-xs text-brand-primary px-2 py-1 rounded hover:bg-brand-primary/10 disabled:text-text-secondary disabled:hover:bg-transparent"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center">
                        <button
                            onClick={handleCancel}
                            className="text-brand-primary font-medium text-sm px-4 py-2 rounded hover:bg-bg-main transition-colors"
                        >
                            Cancel
                        </button>
                        <div ref={postMenuRef} className="relative flex items-center rounded overflow-hidden ml-2">
                            <button
                                disabled={!hasTitle}
                                onClick={handlePost}
                                className="font-medium text-sm px-4 py-2 disabled:bg-surface-border disabled:text-text-secondary enabled:bg-brand-primary/10 enabled:text-brand-primary transition-colors"
                            >
                                {mode === "edit" ? "Save changes" : "Post"}
                            </button>
                            {mode === "create" && (
                                <button
                                    disabled={!hasTitle}
                                    onClick={() => setIsPostMenuOpen((open) => !open)}
                                    aria-label="More post options"
                                    className="px-2 py-2 border-l border-surface-border disabled:bg-surface-border disabled:text-text-secondary enabled:bg-brand-primary/10 enabled:text-brand-primary transition-colors"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            )}

                            {mode === "create" && isPostMenuOpen && hasTitle && (
                                <div className="absolute bottom-full right-0 mb-2 w-40 bg-bg-card border border-surface-border rounded-lg shadow-xl overflow-hidden z-10">
                                    <button
                                        onClick={handlePost}
                                        className="w-full text-left px-3 py-2 text-sm text-text-main hover:bg-bg-main transition-colors"
                                    >
                                        Post now
                                    </button>
                                    <button
                                        disabled
                                        className="w-full text-left px-3 py-2 text-sm text-text-secondary cursor-not-allowed flex items-center justify-between"
                                    >
                                        Schedule
                                        <span className="text-[10px] uppercase tracking-wide">Soon</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}