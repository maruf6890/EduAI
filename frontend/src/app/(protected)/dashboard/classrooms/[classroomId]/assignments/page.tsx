"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Plus,
    FileText,
    Calendar,
    ClipboardList,
    MoreVertical,
    Eye,
    Pencil,
    Trash2,
    Paperclip,
    X,
    CheckCircle2,
    CircleDashed,
    Clock,
} from "lucide-react";
import { private_api_call } from "@/actions/private_api_call";

/* =========================================================================
   TYPES — mirrors backend contract EXACTLY (see POST /assignments screenshot)
   =========================================================================
   Confirmed fields (from your multipart/form-data request body):
     - title: string (required)
     - description: string | null
     - total_marks: integer | null
     - due_date: string ($date-time) | null
     - allow_late_submission: boolean
     - is_published: boolean
     - files: string[]  (array<string> — likely file URLs/paths on response)

   ⚠️ NOT CONFIRMED YET: I was not given the GET /assignments (list) response
   or the POST /assignments response screenshot. The fields below marked
   "ASSUMED" are the minimum a list item needs to render and are NOT part of
   your confirmed contract — replace/remove once you share that screenshot.
   ========================================================================= */

interface Assignment {
    id: number; // ASSUMED — needed for view/edit/delete routes
    classroom_id: number; // ASSUMED — matches path param, useful for list responses
    title: string;
    description: string | null;
    total_marks: number | null;
    due_date: string | null; // $date-time
    allow_late_submission: boolean;
    is_published: boolean;
    files: string[];
    created_at: string; // ASSUMED — used for "posted" ordering/label
}

// Shape of the create-assignment form state (matches request body 1:1)
interface AssignmentFormState {
    title: string;
    description: string;
    total_marks: string; // kept as string for controlled input, cast to number on submit
    due_date: string; // datetime-local input value
    allow_late_submission: boolean;
    is_published: boolean;
    files: File[];
}

const emptyForm: AssignmentFormState = {
    title: "",
    description: "",
    total_marks: "",
    due_date: "",
    allow_late_submission: false,
    is_published: false,
    files: [],
};

/* =========================================================================
   HELPERS
   ========================================================================= */

function formatDueDate(due_date: string | null): string {
    if (!due_date) return "No due date";
    const date = new Date(due_date);
    const now = new Date();
    const isOverdue = date.getTime() < now.getTime();
    const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    });
    const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
    return `${isOverdue ? "Was due" : "Due"} ${formatted}, ${time}`;
}

function isOverdue(due_date: string | null): boolean {
    if (!due_date) return false;
    return new Date(due_date).getTime() < Date.now();
}

/* =========================================================================
   PAGE
   ========================================================================= */

export default function AssignmentsPage() {
    const params = useParams();
    const classroomId = params?.classroomId as string;
    const [role, setRole] = useState<"teacher" | "student">("student");

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<AssignmentFormState>(emptyForm);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ------------------------------ handlers ------------------------------ */



    function handleOpenCreateModal() {
        setForm(emptyForm);
        setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;
        setForm((prev) => ({ ...prev, files: [...prev.files, ...Array.from(e.target.files!)] }));
    }

    function handleRemoveFile(index: number) {
        setForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
    }

    async function handleCreateAssignment(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        // ---------------------------------------------------------------------
        // TODO: POST /api/v1/classrooms/{classroom_id}/assignments
        //

        const body = new FormData();
        body.append("title", form.title);
        if (form.description) body.append("description", form.description);
        if (form.total_marks) body.append("total_marks", form.total_marks);
        if (form.due_date) body.append("due_date", new Date(form.due_date).toISOString());
        body.append("allow_late_submission", String(form.allow_late_submission));
        body.append("is_published", String(form.is_published));
        form.files.forEach((file) => body.append("files", file));

        const res = await private_api_call({
            method: "POST",
            path: `classrooms/${classroomId}/assignments`,
            body,
        });
        const created: Assignment = res.data;
        setAssignments((prev) => [created, ...prev]);


        // Temporary local-only insert so the UI is testable without a backend.
        // const localAssignment: Assignment = {
        //     id: Date.now(),
        //     classroom_id: Number(classroomId) || 0,
        //     title: form.title,
        //     description: form.description || null,
        //     total_marks: form.total_marks ? Number(form.total_marks) : null,
        //     due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        //     allow_late_submission: form.allow_late_submission,
        //     is_published: form.is_published,
        //     files: form.files.map((f) => f.name),
        //     created_at: new Date().toISOString(),
        // };

        // setTimeout(() => {
        //     setAssignments((prev) => [localAssignment, ...prev]);
        //     setIsSubmitting(false);
        //     setIsModalOpen(false);
        // }, 400);
    }

    async function handleViewAssignment(assignment: Assignment) {
        // TODO: GET /api/v1/classrooms/{classroom_id}/assignments/{assignment.id}
        // router.push(`/dashboard/classrooms/${classroomId}/assignments/${assignment.id}`);
        const res = await private_api_call({
            method: "GET",
            path: `classrooms/${classroomId}/assignments/${assignment.id}`,
        });
        // setAssignment(res.data);
        setOpenMenuId(null);
    }

    async function handleEditAssignment(assignment: Assignment) {
        // TODO: PATCH /api/v1/classrooms/{classroom_id}/assignments/{assignment.id}
        const res = await private_api_call({
            method: "PUT",
            path: `classrooms/${classroomId}/assignments/${assignment.id}`,
            body: {
                title: assignment.title,
                description: assignment.description,
                total_marks: assignment.total_marks,
                due_date: assignment.due_date,
                allow_late_submission: assignment.allow_late_submission,
                is_published: assignment.is_published,
            },
        });
        setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? res.data : a)));
        console.log("Edit assignment", assignment.id);
        setOpenMenuId(null);
    }

    async function handleDeleteAssignment(assignment: Assignment) {
        // TODO: DELETE /api/v1/classrooms/{classroom_id}/assignments/{assignment.id}
        // await fetch(`/api/v1/classrooms/${classroomId}/assignments/${assignment.id}`, { method: "DELETE" });

        const res = await private_api_call({
            method: "DELETE",
            path: `classrooms/${classroomId}/assignments/${assignment.id}`,
        });
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
        setOpenMenuId(null);
    }

    // ---------------------------------------------------------------------
    // TODO: GET /api/v1/classrooms/{classroom_id}/assignments  (initial load)
    //
    useEffect(() => {
        async function loadAssignments() {
            const res = await private_api_call({
                method: "GET",
                path: `classrooms/${classroomId}/assignments`,
            });
            setAssignments(res.data);
            if (res.success) {
                setRole(res.data.role);
            }
        }
        loadAssignments();
    }, [classroomId]);
    // ---------------------------------------------------------------------

    /* -------------------------------- render ------------------------------- */

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                        <ClipboardList className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-100">Assignments</h1>
                        <p className="text-sm text-zinc-500">
                            {assignments.length} {assignments.length === 1 ? "assignment" : "assignments"}
                        </p>
                    </div>
                </div>

                {role === "teacher" && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-brand-primary/80 active:bg-brand-primary/60"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Create assignment
                    </button>
                )}
            </div>

            {/* Assignment list */}
            {assignments.length === 0 ? (
                <EmptyState onCreate={handleOpenCreateModal} />
            ) : (
                <div className="flex flex-col gap-3">
                    {assignments.map((assignment) => (
                        <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            isMenuOpen={openMenuId === assignment.id}
                            onToggleMenu={() =>
                                setOpenMenuId((prev) => (prev === assignment.id ? null : assignment.id))
                            }
                            onView={() => handleViewAssignment(assignment)}
                            onEdit={() => handleEditAssignment(assignment)}
                            onDelete={() => handleDeleteAssignment(assignment)}
                        />
                    ))}
                </div>
            )}

            {/* Create assignment modal */}
            {isModalOpen && (
                <CreateAssignmentModal
                    form={form}
                    setForm={setForm}
                    isSubmitting={isSubmitting}
                    onClose={handleCloseModal}
                    onSubmit={handleCreateAssignment}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                />
            )}
        </div>
    );
}

/* =========================================================================
   ASSIGNMENT CARD
   ========================================================================= */

function AssignmentCard({
    assignment,
    isMenuOpen,
    onToggleMenu,
    onView,
    onEdit,
    onDelete,
}: {
    assignment: Assignment;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const overdue = isOverdue(assignment.due_date) && assignment.is_published;

    return (
        <div
            onClick={onView}
            className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-brand-primary bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 sm:items-center sm:p-5"
        >
            {/* Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 sm:h-12 sm:w-12">
                <FileText className="h-5 w-5 text-zinc-400" />
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="truncate text-sm font-medium text-zinc-100 sm:text-base">
                        {assignment.title}
                    </h3>
                    {!assignment.is_published && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                            <CircleDashed className="h-3 w-3" />
                            Draft
                        </span>
                    )}
                </div>

                {assignment.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{assignment.description}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span
                        className={`inline-flex items-center gap-1 ${overdue ? "text-red-400" : ""
                            }`}
                    >
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDueDate(assignment.due_date)}
                    </span>

                    {assignment.total_marks !== null && assignment.total_marks > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {assignment.total_marks} points
                        </span>
                    )}

                    {assignment.files.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5" />
                            {assignment.files.length} {assignment.files.length === 1 ? "file" : "files"}
                        </span>
                    )}

                    {assignment.allow_late_submission && (
                        <span className="inline-flex items-center gap-1 text-zinc-500">
                            <Clock className="h-3.5 w-3.5" />
                            Late submissions allowed
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
                    className="rounded-lg p-2 text-zinc-500 opacity-0 transition-colors hover:bg-brand-primary/10 hover:text-zinc-200 group-hover:opacity-100 data-[open=true]:opacity-100"
                    data-open={isMenuOpen}
                    aria-label="Assignment actions"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>

                {isMenuOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40"
                    >
                        <button
                            onClick={onView}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                        >
                            <Eye className="h-4 w-4" />
                            View
                        </button>
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
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================================================================
   EMPTY STATE
   ========================================================================= */

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-primary py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                <ClipboardList className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-zinc-200">No assignments yet</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Create your first assignment to give students something to work on.
            </p>
            <button
                onClick={onCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950  hover:bg-brand-primary/80"
            >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Create assignment
            </button>
        </div>
    );
}

/* =========================================================================
   CREATE ASSIGNMENT MODAL
   Fields match POST /classrooms/{classroom_id}/assignments EXACTLY:
   title*, description, total_marks, due_date, allow_late_submission,
   is_published, files[]
   ========================================================================= */

function CreateAssignmentModal({
    form,
    setForm,
    isSubmitting,
    onClose,
    onSubmit,
    onFileChange,
    onRemoveFile,
}: {
    form: AssignmentFormState;
    setForm: React.Dispatch<React.SetStateAction<AssignmentFormState>>;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-brand-primary bg-zinc-900 sm:max-w-lg sm:rounded-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-zinc-100">Create assignment</h2>
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
                                placeholder="e.g. Photosynthesis Lab Report"
                                className="w-full rounded-lg border border-brand-primary bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        {/* description */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Instructions for students..."
                                rows={3}
                                className="w-full resize-none rounded-lg border border-brand-primary bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        {/* total_marks + due_date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                    Total marks
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.total_marks}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, total_marks: e.target.value }))
                                    }
                                    placeholder="0"
                                    className="w-full rounded-lg border border-brand-primary bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                    Due date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.due_date}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, due_date: e.target.value }))
                                    }
                                    className="w-full rounded-lg border border-brand-primary bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 [color-scheme:dark] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                            </div>
                        </div>

                        {/* files */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Attachments
                            </label>
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand-primary px-3 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
                                <Paperclip className="h-4 w-4" />
                                Add files
                                <input type="file" multiple onChange={onFileChange} className="hidden" />
                            </label>

                            {form.files.length > 0 && (
                                <ul className="mt-2 flex flex-col gap-1.5">
                                    {form.files.map((file, index) => (
                                        <li
                                            key={`${file.name}-${index}`}
                                            className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-300"
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                <span className="truncate">{file.name}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveFile(index)}
                                                className="ml-2 shrink-0 text-zinc-500 hover:text-red-400"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* allow_late_submission + is_published */}
                        <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                            <label className="flex cursor-pointer items-center justify-between">
                                <span className="text-sm text-zinc-300">Allow late submissions</span>
                                <ToggleSwitch
                                    checked={form.allow_late_submission}
                                    onChange={(checked) =>
                                        setForm((prev) => ({ ...prev, allow_late_submission: checked }))
                                    }
                                />
                            </label>
                            <label className="flex cursor-pointer items-center justify-between">
                                <span className="text-sm text-zinc-300">Publish immediately</span>
                                <ToggleSwitch
                                    checked={form.is_published}
                                    onChange={(checked) =>
                                        setForm((prev) => ({ ...prev, is_published: checked }))
                                    }
                                />
                            </label>
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
                        disabled={!form.title || isSubmitting}
                        className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                    >
                        {isSubmitting ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   TOGGLE SWITCH
   ========================================================================= */

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-primary" : "bg-zinc-700"
                }`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
            />
        </button>
    );
}