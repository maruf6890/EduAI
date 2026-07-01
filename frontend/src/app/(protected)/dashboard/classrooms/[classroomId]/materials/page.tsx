"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
    Plus,
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

/* =========================================================================
   TYPES — mirror your service layer + Pydantic models EXACTLY
   =========================================================================
   Source of truth:
     - UpdateMaterialInput (Pydantic)
     - upload_material / update_material / delete_material /
       get_central_materials / get_private_materials / get_material (service)
     - endpoint list screenshot (/api/v1/classrooms/{classroom_id}/materials/...)

   Every response you return follows: { success, message, data }
   ========================================================================= */

// RETURNING clause in upload_material's INSERT into material_files
interface MaterialFile {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    uploaded_at: string; // ISO datetime, serialized via _serialize()
}

type MaterialVisibility = "CENTRAL" | "PRIVATE";

// Full material shape as returned by the service. `uploader_name` only shows
// up on responses that JOIN users (get_central_materials, get_material) —
// upload_material, update_material, and get_private_materials never select
// it, since get_private_materials is always scoped to uploaded_by = user_id.
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

// Matches UpdateMaterialInput exactly — both fields optional, title trimmed
// and rejected if blank by the `title_not_empty` validator.
interface UpdateMaterialInput {
    title?: string;
    description?: string;
}

// Local form shape for the upload modal — upload_material takes
// classroom_id, uploaded_by (from auth), title, description, visibility,
// files (multipart), so this mirrors everything the client actually submits.
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

/* =========================================================================
   DUMMY DATA — same field names as get_central_materials / get_private_materials'
   `data` array. Swap `useState(dummyCentral)` / `useState(dummyPrivate)` for
   the fetched `json.data` and nothing else needs to change.
   ========================================================================= */

// ⚠️ ASSUMED: stand-in for the authenticated user until auth is wired up.
// Mirrors uploaded_by everywhere ownership is checked (_verify_member,
// the `material["uploaded_by"] != user_id` guards in update/delete).
const CURRENT_USER_ID = 101;

// ⚠️ ASSUMED: stand-in for `classroom.owner_id === user.id`, which is what
// gates CENTRAL uploads server-side. Toggle in the header below for demo.
const dummyIsClassroomOwner = true;

const dummyCentral: Material[] = [
    {
        id: 1,
        classroom_id: 1,
        title: "Week 3 — Linear Algebra Notes",
        description: "Vector spaces, basis, and dimension. Read before Thursday's lecture.",
        visibility: "CENTRAL",
        uploaded_by: 55,
        uploader_name: "Dr. Farhan Kabir",
        created_at: "2026-06-24T09:15:00.000Z",
        updated_at: "2026-06-24T09:15:00.000Z",
        files: [
            { id: 1, file_name: "linear-algebra-week3.pdf", file_url: "#", file_type: "pdf", uploaded_at: "2026-06-24T09:15:00.000Z" },
            { id: 2, file_name: "practice-set-3.pdf", file_url: "#", file_type: "pdf", uploaded_at: "2026-06-24T09:15:00.000Z" },
        ],
    },
    {
        id: 2,
        classroom_id: 1,
        title: "Midterm Syllabus",
        description: "Covers chapters 1 through 6. Closed-book, 90 minutes.",
        visibility: "CENTRAL",
        uploaded_by: 55,
        uploader_name: "Dr. Farhan Kabir",
        created_at: "2026-06-18T14:02:00.000Z",
        updated_at: "2026-06-18T14:02:00.000Z",
        files: [{ id: 3, file_name: "midterm-syllabus.docx", file_url: "#", file_type: "docx", uploaded_at: "2026-06-18T14:02:00.000Z" }],
    },
    {
        id: 3,
        classroom_id: 1,
        title: "Recommended Reading List",
        description: null,
        visibility: "CENTRAL",
        uploaded_by: 55,
        uploader_name: "Dr. Farhan Kabir",
        created_at: "2026-06-10T11:30:00.000Z",
        updated_at: "2026-06-10T11:30:00.000Z",
        files: [
            { id: 4, file_name: "reading-list.pdf", file_url: "#", file_type: "pdf", uploaded_at: "2026-06-10T11:30:00.000Z" },
            { id: 5, file_name: "supplementary-links.txt", file_url: "#", file_type: "txt", uploaded_at: "2026-06-10T11:30:00.000Z" },
            { id: 6, file_name: "chapter-summaries.pdf", file_url: "#", file_type: "pdf", uploaded_at: "2026-06-10T11:30:00.000Z" },
        ],
    },
];

const dummyPrivate: Material[] = [
    {
        id: 4,
        classroom_id: 1,
        title: "My revision flashcards",
        description: "Personal notes, not shared with the class.",
        visibility: "PRIVATE",
        uploaded_by: CURRENT_USER_ID,
        created_at: "2026-06-27T20:41:00.000Z",
        updated_at: "2026-06-27T20:41:00.000Z",
        files: [{ id: 7, file_name: "flashcards-ch1-3.pdf", file_url: "#", file_type: "pdf", uploaded_at: "2026-06-27T20:41:00.000Z" }],
    },
    {
        id: 5,
        classroom_id: 1,
        title: "Draft essay outline",
        description: null,
        visibility: "PRIVATE",
        uploaded_by: CURRENT_USER_ID,
        created_at: "2026-06-20T08:05:00.000Z",
        updated_at: "2026-06-20T08:05:00.000Z",
        files: [{ id: 8, file_name: "essay-outline-v2.docx", file_url: "#", file_type: "docx", uploaded_at: "2026-06-20T08:05:00.000Z" }],
    },
];

/* =========================================================================
   HELPERS
   ========================================================================= */

function formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}

function fileExt(name: string): string {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop()!.toUpperCase() : "FILE";
}

function visibilityStyles(visibility: MaterialVisibility): { label: string; className: string; icon: typeof Globe2 } {
    return visibility === "CENTRAL"
        ? { label: "Central", className: "bg-brand-secondary/10 text-brand-secondary", icon: Globe2 }
        : { label: "Private", className: "bg-zinc-800 text-zinc-400", icon: Lock };
}

/* =========================================================================
   PAGE
   ========================================================================= */

export default function MaterialsPage() {
    const params = useParams();
    const classroomId = params?.classroomId as string;

    const [tab, setTab] = useState<MaterialVisibility>("CENTRAL");
    const [central, setCentral] = useState<Material[]>(dummyCentral);
    const [privateMats, setPrivateMats] = useState<Material[]>(dummyPrivate);
    const [isClassroomOwner, setIsClassroomOwner] = useState(dummyIsClassroomOwner);

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
        setUploadForm({ ...emptyUploadForm, visibility: isClassroomOwner ? "CENTRAL" : "PRIVATE" });
        setIsUploadOpen(true);
    }

    function handleCloseUploadModal() {
        setIsUploadOpen(false);
    }

    async function handleUploadMaterial(e: React.FormEvent) {
        e.preventDefault();
        setIsUploading(true);

        // ---------------------------------------------------------------------
        // TODO: POST /api/v1/classrooms/{classroom_id}/materials  (upload_material)
        // multipart/form-data — do NOT set Content-Type manually, let the
        // browser attach the boundary.
        //
        // const body = new FormData();
        // body.append("title", uploadForm.title);
        // if (uploadForm.description) body.append("description", uploadForm.description);
        // body.append("visibility", uploadForm.visibility);
        // uploadForm.files.forEach((file) => body.append("files", file));
        //
        // const res = await fetch(`/api/v1/classrooms/${classroomId}/materials`, {
        //   method: "POST",
        //   body,
        // });
        // const json = await res.json(); // { success, message, data: Material }
        // if (json.data.visibility === "CENTRAL") {
        //   setCentral((prev) => [json.data, ...prev]);
        // } else {
        //   setPrivateMats((prev) => [json.data, ...prev]);
        // }
        // ---------------------------------------------------------------------

        // Temporary local-only insert so the UI is testable without a backend.
        const localMaterial: Material = {
            id: Date.now(),
            classroom_id: Number(classroomId) || 0,
            title: uploadForm.title,
            description: uploadForm.description || null,
            visibility: uploadForm.visibility,
            uploaded_by: CURRENT_USER_ID,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            files: uploadForm.files.map((file, i) => ({
                id: Date.now() + i,
                file_name: file.name,
                file_url: "#",
                file_type: fileExt(file.name).toLowerCase(),
                uploaded_at: new Date().toISOString(),
            })),
        };

        setTimeout(() => {
            if (localMaterial.visibility === "CENTRAL") {
                setCentral((prev) => [localMaterial, ...prev]);
                setTab("CENTRAL");
            } else {
                setPrivateMats((prev) => [localMaterial, ...prev]);
                setTab("PRIVATE");
            }
            setIsUploading(false);
            setIsUploadOpen(false);
        }, 400);
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

        // ---------------------------------------------------------------------
        // TODO: PUT /api/v1/classrooms/{classroom_id}/materials/{material_id}  (update_material)
        //
        // const res = await fetch(
        //   `/api/v1/classrooms/${classroomId}/materials/${editTarget.id}`,
        //   {
        //     method: "PUT",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(editForm), // { title?, description? }
        //   }
        // );
        // const json = await res.json(); // { success, message, data: Material }
        // Backend re-runs the `title_not_empty` validator server-side too —
        // 400 with detail "title cannot be blank" if it fails there.
        // ---------------------------------------------------------------------

        setTimeout(() => {
            const title = (editForm.title ?? editTarget.title).trim();
            const description = editForm.description ?? editTarget.description ?? "";
            const apply = (list: Material[]) =>
                list.map((m) => (m.id === editTarget.id ? { ...m, title, description } : m));
            setCentral(apply);
            setPrivateMats(apply);
            setIsSavingEdit(false);
            setEditTarget(null);
        }, 400);
    }

    function handleDeleteMaterial(material: Material) {
        // TODO: DELETE /api/v1/classrooms/{classroom_id}/materials/{material_id}  (delete_material)
        // await fetch(`/api/v1/classrooms/${classroomId}/materials/${material.id}`, { method: "DELETE" });
        // Backend only allows the uploader to delete — `uploaded_by !== user_id` -> 403.
        setCentral((prev) => prev.filter((m) => m.id !== material.id));
        setPrivateMats((prev) => prev.filter((m) => m.id !== material.id));
        setOpenMenuId(null);
    }

    // ---------------------------------------------------------------------
    // TODO: GET /api/v1/classrooms/{classroom_id}/materials/central  (initial load)
    // TODO: GET /api/v1/classrooms/{classroom_id}/materials/private  (initial load)
    //
    // useEffect(() => {
    //   async function loadMaterials() {
    //     const [centralRes, privateRes] = await Promise.all([
    //       fetch(`/api/v1/classrooms/${classroomId}/materials/central`),
    //       fetch(`/api/v1/classrooms/${classroomId}/materials/private`),
    //     ]);
    //     setCentral((await centralRes.json()).data);
    //     setPrivateMats((await privateRes.json()).data);
    //   }
    //   loadMaterials();
    // }, [classroomId]);
    //
    // Other endpoint available on this resource (not wired into this page yet):
    //   GET /materials/{material_id}   get_material — single-material fetch,
    //   useful if you later deep-link to a specific material instead of
    //   reusing the locally-cached row for the view modal.
    // ---------------------------------------------------------------------

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
                    {/* ⚠️ Demo-only role switch — remove once auth tells us who's logged in */}
                    <label className="flex items-center gap-2 text-xs text-zinc-500">
                        Viewing as
                        <select
                            value={isClassroomOwner ? "teacher" : "student"}
                            onChange={(e) => setIsClassroomOwner(e.target.value === "teacher")}
                            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs font-medium text-zinc-300 focus:border-brand-primary focus:outline-none"
                        >
                            <option value="teacher">Teacher</option>
                            <option value="student">Student</option>
                        </select>
                    </label>

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
                            canManage={material.uploaded_by === CURRENT_USER_ID}
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
                    canPickCentral={isClassroomOwner}
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

    function removeFile(index: number) {
        setForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
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
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-4">
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
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 px-3 py-6 text-center hover:border-brand-secondary">
                                <Upload className="mb-1 h-5 w-5 text-zinc-500" />
                                <span className="text-sm text-zinc-400">Click to choose files</span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, files: Array.from(e.target.files ?? []) }))
                                    }
                                />
                            </label>
                            {form.files.length > 0 && (
                                <ul className="mt-2 flex flex-col gap-1">
                                    {form.files.map((file, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-2.5 py-1.5 text-xs text-zinc-400"
                                        >
                                            <span className="flex items-center gap-1.5 truncate">
                                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="shrink-0 text-zinc-500 hover:text-red-400"
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
                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={onSubmit}
                        disabled={!isValid || isSubmitting}
                        className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 disabled:opacity-100"
                    >
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