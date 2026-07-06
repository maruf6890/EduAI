"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    FolderOpen,
    Paperclip,
    Calendar,
    MoreVertical,
    Eye,
    Pencil,
    Trash2,
    X,
    Globe2,
    Lock,
    Download,
    FileText,
    Upload,
    Inbox,
} from "lucide-react";
import { private_api_call } from "@/actions/private_api_call";
import { useClassroom } from "../ClassroomContext";

interface MaterialFile {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    uploaded_at: string;
}

type MaterialVisibility = "CENTRAL" | "PRIVATE";

interface Material {
    id: number;
    classroom_id: number;
    title: string;
    description: string | null;
    visibility: MaterialVisibility;
    uploaded_by: number;
    uploader_name?: string;
    created_at: string;
    updated_at: string;
    files: MaterialFile[];
}

interface UpdateMaterialInput {
    title?: string;
    description?: string;
}

interface UploadFormState {
    title: string;
    description: string;
    visibility: MaterialVisibility;
    files: File[];
}

const emptyUploadForm: UploadFormState = {
    title: "",
    description: "",
    visibility: "PRIVATE",
    files: [],
};







function formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}



function visibilityStyles(visibility: MaterialVisibility): { label: string; className: string; icon: typeof Globe2 } {
    return visibility === "CENTRAL"
        ? { label: "Central", className: "bg-brand-secondary/10 text-brand-secondary", icon: Globe2 }
        : { label: "Private", className: "bg-zinc-800 text-zinc-400", icon: Lock };
}



export default function MaterialsPage() {
    const params = useParams();
    const classroomId = params?.classroomId as string;
    const classroom= useClassroom();

    const [tab, setTab] = useState<MaterialVisibility>("CENTRAL");
    const [central, setCentral] = useState<Material[]>([]);
    const [privateMats, setPrivateMats] = useState<Material[]>([]);

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState<UploadFormState>(emptyUploadForm);
    const [isUploading, setIsUploading] = useState(false);

    const [viewTarget, setViewTarget] = useState<Material | null>(null);
    const [editTarget, setEditTarget] = useState<Material | null>(null);
    const [editForm, setEditForm] = useState<UpdateMaterialInput>({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const materials = tab === "CENTRAL" ? central : privateMats;

    /* ------------------------------ handlers ------------------------------ */

    function handleOpenUploadModal() {
        setUploadForm({ ...emptyUploadForm, visibility: classroom?.current_user.role==="teacher" ? "CENTRAL" : "PRIVATE" });
        setIsUploadOpen(true);
    }

    function handleCloseUploadModal() {
        setIsUploadOpen(false);
    }

    async function handleUploadMaterial(e: React.FormEvent) {
        e.preventDefault();
        if (!uploadForm.title.trim() || uploadForm.files.length === 0) return;

        setIsUploading(true);
 
        const formData = new FormData();
        formData.append("title", uploadForm.title.trim());
        formData.append("description", uploadForm.description.trim());
        formData.append("visibility", uploadForm.visibility);
        uploadForm.files.forEach((file) => formData.append("files", file));

        const res = await private_api_call({
            method: "POST",
            path: `classrooms/${classroomId}/materials`,
            body: formData,
        });

        setIsUploading(false);

        if (!res.success || !res.data) return;

        if (uploadForm.visibility === "CENTRAL") {
            setCentral((prev) => [res.data as Material, ...prev]);
        } else {
            setPrivateMats((prev) => [res.data as Material, ...prev]);
        }
        setIsUploadOpen(false);
    }

    function handleViewMaterial(material: Material) {
        setViewTarget(material);
        setOpenMenuId(null);
    }

    function handleOpenEditModal(material: Material) {
        setEditTarget(material);
        setEditForm({ title: material.title, description: material.description ?? "" });
        setOpenMenuId(null);
    }

    async function handleSaveEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        setIsSavingEdit(true);

        const res = await private_api_call({
            method: "PUT",
            path: `classrooms/${classroomId}/materials/${editTarget.id}`,
            body: editForm,
        });

        const json = res;
        if (editTarget.visibility === "CENTRAL") {
            setCentral((prev) =>
                prev.map((m) => (m.id === editTarget.id ? { ...m, ...editForm } : m))
            );
        } else {
            setPrivateMats((prev) =>
                prev.map((m) => (m.id === editTarget.id ? { ...m, ...editForm } : m))
            );
        }
        setIsSavingEdit(false);
        setEditTarget(null);
    }




    async function handleDeleteMaterial(material: Material) {
        const res = await private_api_call({
            method: "DELETE",
            path: `classrooms/${classroomId}/materials/${material.id}`,
        });

        if (!res.success) return;

        setCentral((prev) => prev.filter((m) => m.id !== material.id));
        setPrivateMats((prev) => prev.filter((m) => m.id !== material.id));
        setOpenMenuId(null);
    }

    useEffect(() => {
        if (!classroomId) return;

        async function loadMaterials() {
            const [centralRes, privateRes] = await Promise.all([
                private_api_call({
                    method: "GET",
                    path: `classrooms/${classroomId}/materials/central`,
                }),
                private_api_call({
                    method: "GET",
                    path: `classrooms/${classroomId}/materials/private`,
                }),
            ]);
            if (centralRes.success) setCentral(centralRes.data ?? []);
            if (privateRes.success) setPrivateMats(privateRes.data ?? []);
        }
        loadMaterials();
    }, [classroomId]);

    /* -------------------------------- render ------------------------------- */

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                        <FolderOpen className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-100">Materials</h1>
                        <p className="text-sm text-zinc-500">
                            {materials.length} {materials.length === 1 ? "material" : "materials"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenUploadModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90 active:opacity-80"
                    >
                        <Upload className="h-4 w-4" strokeWidth={2.5} />
                        Upload material
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-5 inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
                {(["CENTRAL", "PRIVATE"] as MaterialVisibility[]).map((v) => (
                    <button
                        key={v}
                        onClick={() => setTab(v)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === v ? "bg-brand-primary text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                    >
                        {v === "CENTRAL" ? "Central" : "Private"}
                        <span className="ml-1.5 opacity-70">{v === "CENTRAL" ? central.length : privateMats.length}</span>
                    </button>
                ))}
            </div>

            {/* Material list */}
            {materials.length === 0 ? (
                <EmptyState onUpload={handleOpenUploadModal} tab={tab} />
            ) : (
                <div className="flex flex-col gap-3">
                    {materials.map((material) => (
                        <MaterialCard
                            key={material.id}
                            material={material}
                            canManage={material.uploaded_by.toString() === classroom?.current_user.id}
                            isMenuOpen={openMenuId === material.id}
                            onToggleMenu={() => setOpenMenuId((prev) => (prev === material.id ? null : material.id))}
                            onView={() => handleViewMaterial(material)}
                            onEdit={() => handleOpenEditModal(material)}
                            onDelete={() => handleDeleteMaterial(material)}
                        />
                    ))}
                </div>
            )}

            {/* Upload material modal */}
            {isUploadOpen && (
                <UploadMaterialModal
                    form={uploadForm}
                    setForm={setUploadForm}
                    isSubmitting={isUploading}
                    canPickCentral={classroom?.current_user.role === "teacher"}
                    onClose={handleCloseUploadModal}
                    onSubmit={handleUploadMaterial}
                />
            )}

            {/* Edit material modal */}
            {editTarget && (
                <EditMaterialModal
                    form={editForm}
                    setForm={setEditForm}
                    isSubmitting={isSavingEdit}
                    onClose={() => setEditTarget(null)}
                    onSubmit={handleSaveEdit}
                />
            )}

            {/* View material modal */}
            {viewTarget && <ViewMaterialModal material={viewTarget} onClose={() => setViewTarget(null)} />}
        </div>
    );
}

/* =========================================================================
   MATERIAL CARD
   ========================================================================= */

function MaterialCard({
    material,
    canManage,
    isMenuOpen,
    onToggleMenu,
    onView,
    onEdit,
    onDelete,
}: {
    material: Material;
    canManage: boolean;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const visibility = visibilityStyles(material.visibility);
    const VisibilityIcon = visibility.icon;

    return (
        <div
            onClick={onView}
            className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 sm:items-center sm:p-5"
        >
            {/* Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 sm:h-12 sm:w-12">
                <FileText className="h-5 w-5 text-zinc-400" />
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="truncate text-sm font-medium text-zinc-100 sm:text-base">{material.title}</h3>

                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${visibility.className}`}>
                        <VisibilityIcon className="h-3 w-3" />
                        {visibility.label}
                    </span>
                </div>

                {material.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{material.description}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(material.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" />
                        {material.files.length} {material.files.length === 1 ? "file" : "files"}
                    </span>
                    {material.uploader_name && (
                        <span className="inline-flex items-center gap-1">
                            {material.uploader_name}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions menu */}
            <div className="relative shrink-0">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleMenu();
                    }}
                    className="rounded-lg p-2 text-zinc-500 opacity-0 transition-colors hover:bg-zinc-800 hover:text-zinc-200 group-hover:opacity-100 data-[open=true]:opacity-100"
                    data-open={isMenuOpen}
                    aria-label="Material actions"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>

                {isMenuOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40"
                    >
                        <button
                            onClick={onView}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                        >
                            <Eye className="h-4 w-4" />
                            View
                        </button>

                        {canManage && (
                            <>
                                <button
                                    onClick={onEdit}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================================================================
   EMPTY STATE
   ========================================================================= */

function EmptyState({ onUpload, tab }: { onUpload: () => void; tab: MaterialVisibility }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                <Inbox className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-zinc-200">
                No {tab === "CENTRAL" ? "central" : "private"} materials yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
                {tab === "CENTRAL"
                    ? "Materials uploaded here are visible to the whole class."
                    : "Materials uploaded here are only visible to you."}
            </p>
            <button
                onClick={onUpload}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90"
            >
                <Upload className="h-4 w-4" strokeWidth={2.5} />
                Upload material
            </button>
        </div>
    );
}

/* =========================================================================
   UPLOAD MATERIAL MODAL
   Fields match what upload_material accepts EXACTLY: title*, description,
   visibility (CENTRAL/PRIVATE — CENTRAL gated to classroom owner), files*
   ========================================================================= */

function UploadMaterialModal({
    form,
    setForm,
    isSubmitting,
    canPickCentral,
    onClose,
    onSubmit,
}: {
    form: UploadFormState;
    setForm: React.Dispatch<React.SetStateAction<UploadFormState>>;
    isSubmitting: boolean;
    canPickCentral: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    const isValid = form.title.trim().length > 0 && form.files.length > 0;

    function addFiles(picked: FileList | null) {
        if (!picked) return;
        const incoming = Array.from(picked);
        setForm((prev) => ({ ...prev, files: [...prev.files, ...incoming] }));
    }

    function removeFile(index: number) {
        setForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
    }

    function formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-zinc-800 bg-zinc-900 sm:max-w-lg sm:rounded-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-zinc-100">Upload material</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form id="upload-material-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="flex flex-col gap-4">
                        {/* title */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g. Week 4 lecture slides"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        {/* description */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="A short note about what this covers"
                                rows={2}
                                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        {/* visibility — CENTRAL only offered to the classroom owner,
                            matches the 403 the backend throws otherwise */}
                        {canPickCentral && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Visibility</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["PRIVATE", "CENTRAL"] as MaterialVisibility[]).map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, visibility: v }))}
                                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${form.visibility === v
                                                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                }`}
                                        >
                                            {v === "CENTRAL" ? "Central (whole class)" : "Private (only me)"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* files */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Files <span className="text-red-400">*</span>
                            </label>
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 px-3 py-6 text-center transition-colors hover:border-brand-primary hover:bg-zinc-950/40">
                                <Upload className="mb-1.5 h-5 w-5 text-zinc-500" />
                                <span className="text-sm text-zinc-400">Click to choose files</span>
                                <span className="mt-0.5 text-xs text-zinc-600">Multiple files supported</span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        addFiles(e.target.files);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                            {form.files.length > 0 && (
                                <ul className="mt-2 flex flex-col gap-1">
                                    {form.files.map((file, i) => (
                                        <li
                                            key={`${file.name}-${i}`}
                                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-2.5 py-1.5 text-xs text-zinc-400"
                                        >
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                <span className="truncate text-zinc-300">{file.name}</span>
                                                <span className="shrink-0 text-zinc-600">· {formatBytes(file.size)}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="shrink-0 rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                                                aria-label={`Remove ${file.name}`}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="upload-material-form"
                        disabled={!isValid || isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                    >
                        {isSubmitting && (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
                        )}
                        {isSubmitting ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   EDIT MATERIAL MODAL
   Fields match UpdateMaterialInput EXACTLY: title?, description?
   ========================================================================= */

function EditMaterialModal({
    form,
    setForm,
    isSubmitting,
    onClose,
    onSubmit,
}: {
    form: UpdateMaterialInput;
    setForm: React.Dispatch<React.SetStateAction<UpdateMaterialInput>>;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    // Mirrors the `title_not_empty` validator on UpdateMaterialInput —
    // blank/whitespace-only titles are rejected client-side too.
    const isValid = (form.title ?? "").trim().length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex w-full flex-col rounded-t-2xl border border-zinc-800 bg-zinc-900 sm:max-w-md sm:rounded-2xl"
            >
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-zinc-100">Edit material</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="px-5 py-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                value={form.title ?? ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
                            <textarea
                                value={form.description ?? ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || isSubmitting}
                            className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 disabled:opacity-100"
                        >
                            {isSubmitting ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* =========================================================================
   VIEW MATERIAL MODAL
   ========================================================================= */

function ViewMaterialModal({ material, onClose }: { material: Material; onClose: () => void }) {
    const visibility = visibilityStyles(material.visibility);
    const VisibilityIcon = visibility.icon;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-zinc-800 bg-zinc-900 sm:max-w-lg sm:rounded-2xl"
            >
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-zinc-100">{material.title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${visibility.className}`}>
                            <VisibilityIcon className="h-3 w-3" />
                            {visibility.label}
                        </span>
                        <span className="text-xs text-zinc-500">Uploaded {formatDate(material.created_at)}</span>
                        {material.uploader_name && (
                            <span className="text-xs text-zinc-500">by {material.uploader_name}</span>
                        )}
                    </div>

                    {material.description && (
                        <p className="mb-4 text-sm text-zinc-400">{material.description}</p>
                    )}

                    <p className="mb-2 text-xs font-medium text-zinc-500">Files</p>
                    <ul className="flex flex-col gap-2">
                        {material.files.map((file) => (
                            <li
                                key={file.id}
                                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
                            >
                                <span className="flex items-center gap-2 text-sm text-zinc-300">
                                    <FileText className="h-4 w-4 text-brand-primary" />
                                    {file.file_name}
                                </span>
                                <a
                                    href={file.file_url}
                                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}