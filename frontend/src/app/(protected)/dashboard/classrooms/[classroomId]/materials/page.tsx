"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { private_api_call } from "@/actions/private_api_call";
import { useClassroom } from "../ClassroomContext";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Globe2,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

type Visibility = "CENTRAL" | "PRIVATE";
type IngestionStatus = "indexed" | "failed" | "no_extractable_text" | "skipped" | undefined;

interface Material {
  id: string;
  title: string;
  description: string;
  visibility: Visibility;
  url: string;
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
  ingestionStatus: IngestionStatus;
  isMine: boolean;
}

interface BackendMaterial {
  id: number | string;
  title: string;
  description?: string | null;
  visibility: Visibility;
  url: string;
  uploaded_by: number | string;
  uploader_name?: string;
  created_at?: string;
  ingestion_status?: IngestionStatus;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapMaterial(item: BackendMaterial, currentUserId: string): Material {
  return {
    id: String(item.id),
    title: item.title,
    description: item.description ?? "",
    visibility: item.visibility,
    url: item.url,
    uploadedBy: String(item.uploaded_by),
    uploaderName: item.uploader_name,
    createdAt: formatDate(item.created_at),
    ingestionStatus: item.ingestion_status,
    isMine: String(item.uploaded_by) === currentUserId,
  };
}

// ── Main component ───────────────────────────────────────────────────────────

export default function MaterialsSection() {
  const params = useParams();
  const classroomId = params.classroomId as string;
  const classroom = useClassroom();
  const isTeacher = classroom.current_user.role === "teacher";
  const currentUserId = String(classroom.current_user.id);

  const [centralMaterials, setCentralMaterials] = useState<Material[]>([]);
  const [privateMaterials, setPrivateMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const fetchMaterials = async () => {
    setIsLoading(true);

    const [centralRes, privateRes] = await Promise.all([
      private_api_call({ path: `classrooms/${classroomId}/materials/central`, method: "GET" }),
      private_api_call({ path: `classrooms/${classroomId}/materials/private`, method: "GET" }),
    ]);

    if (centralRes.success && Array.isArray(centralRes.data)) {
      setCentralMaterials(centralRes.data.map((m: BackendMaterial) => mapMaterial(m, currentUserId)));
    } else if (!centralRes.success) {
      console.error("Failed to load central materials:", centralRes.message);
    }

    if (privateRes.success && Array.isArray(privateRes.data)) {
      setPrivateMaterials(privateRes.data.map((m: BackendMaterial) => mapMaterial(m, currentUserId)));
    } else if (!privateRes.success) {
      console.error("Failed to load private materials:", privateRes.message);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) await fetchMaterials();
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  // NOTE: backend upload_material() declares `files: List[UploadFile]` (plural)
// and only uses files[0], so the multipart field name MUST be "files" to
// bind correctly — even though we only ever send one file per material.
const handleUpload = async (
    title: string,
    description: string,
    visibility: Visibility,
    file: File,
  ): Promise<boolean> => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("visibility", visibility);
    formData.append("files", file);

    const res = await private_api_call({
      path: `classrooms/${classroomId}/materials`,
      method: "POST",
      body: formData,
    });

    if (res.success && res.data) {
      const mapped = mapMaterial(res.data, currentUserId);
      if (mapped.visibility === "CENTRAL") {
        setCentralMaterials((prev) => [mapped, ...prev]);
      } else {
        setPrivateMaterials((prev) => [mapped, ...prev]);
      }
      toast.success("Material uploaded");
      return true;
    }

    toast.error(res.message || "Failed to upload material");
    return false;
  };

  // Backend update_material() only accepts title/description — visibility
  // and the file itself aren't editable after upload.
  const handleUpdate = async (
    materialId: string,
    title: string,
    description: string,
  ): Promise<boolean> => {
    const res = await private_api_call({
      path: `classrooms/${classroomId}/materials/${materialId}`,
      method: "PUT",
      body: { title, description },
    });

    if (res.success && res.data) {
      const mapped = mapMaterial(res.data, currentUserId);
      const patch = (list: Material[]) => list.map((m) => (m.id === materialId ? mapped : m));
      setCentralMaterials(patch);
      setPrivateMaterials(patch);
      toast.success("Material updated");
      return true;
    }

    toast.error(res.message || "Failed to update material");
    return false;
  };

  const handleDelete = async (material: Material) => {
    const res = await private_api_call({
      path: `classrooms/${classroomId}/materials/${material.id}`,
      method: "DELETE",
    });

    if (res.success) {
      setCentralMaterials((prev) => prev.filter((m) => m.id !== material.id));
      setPrivateMaterials((prev) => prev.filter((m) => m.id !== material.id));
      toast.success(`Deleted "${material.title}"`);
    } else {
      toast.error(res.message || "Failed to delete material");
    }
  };

  const openCreateModal = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  // Only the teacher can upload CENTRAL materials; any enrolled member
  // (teacher or student) can upload their own PRIVATE material — matches
  // upload_material()'s authorization rules exactly.
  const canUploadCentral = isTeacher;

  return (
    <div className="flex flex-col gap-6">
      <TooltipProvider>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
            <BookOpen className="h-5 w-5 text-text-main" />
            <p className="text-xs uppercase tracking-[3px] text-text-muted text-shadow-2xs">
              Materials
            </p>
          </div>

          <Button
            type="button"
            onClick={openCreateModal}
            className="gap-2 rounded-sm bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30"
          >
            <Plus className="h-4 w-4" />
            Add material
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-border-main/80 px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">Loading materials…</p>
          </div>
        ) : (
          <>
            <MaterialGroup
              label="Central materials"
              icon={<Globe2 className="h-4 w-4" />}
              materials={centralMaterials}
              isTeacher={isTeacher}
              onEdit={openEditModal}
              onDelete={handleDelete}
              emptyLabel="No central materials yet."
            />

            <MaterialGroup
              label="My private materials"
              icon={<Lock className="h-4 w-4" />}
              materials={privateMaterials}
              isTeacher={isTeacher}
              onEdit={openEditModal}
              onDelete={handleDelete}
              emptyLabel="You haven't uploaded any private materials yet."
            />
          </>
        )}
      </TooltipProvider>

      {isModalOpen && (
        <MaterialModal
          mode={editingMaterial ? "edit" : "create"}
          initialTitle={editingMaterial?.title ?? ""}
          initialDescription={editingMaterial?.description ?? ""}
          initialVisibility={editingMaterial?.visibility ?? (canUploadCentral ? "CENTRAL" : "PRIVATE")}
          allowCentral={canUploadCentral}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMaterial(null);
          }}
          onSubmit={async (title, description, visibility, file) => {
            let ok = false;
            if (editingMaterial) {
              ok = await handleUpdate(editingMaterial.id, title, description);
            } else if (file) {
              ok = await handleUpload(title, description, visibility, file);
            }
            if (ok) {
              setIsModalOpen(false);
              setEditingMaterial(null);
            }
          }}
        />
      )}
    </div>
  );
}

// ── Ingestion status badge ────────────────────────────────────────────────────

function IngestionBadge({ status }: { status: IngestionStatus }) {
  if (!status || status === "skipped") return null;

  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    indexed: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Indexed for AI search",
      className: "bg-emerald-500/15 text-emerald-400",
    },
    failed: {
      icon: <XCircle className="h-3 w-3" />,
      label: "Indexing failed — try re-uploading",
      className: "bg-red-500/15 text-red-400",
    },
    no_extractable_text: {
      icon: <XCircle className="h-3 w-3" />,
      label: "No extractable text found (scanned PDF?)",
      className: "bg-zinc-500/15 text-zinc-400",
    },
  };

  const entry = config[status];
  if (!entry) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${entry.className}`}
        >
          {entry.icon}
        </span>
      </TooltipTrigger>
      <TooltipContent>{entry.label}</TooltipContent>
    </Tooltip>
  );
}

// ── Material list group ───────────────────────────────────────────────────────

function MaterialGroup({
  label,
  icon,
  materials,
  isTeacher,
  onEdit,
  onDelete,
  emptyLabel,
}: {
  label: string;
  icon: React.ReactNode;
  materials: Material[];
  isTeacher: boolean;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
        {icon}
        {label}
      </div>

      {materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-main/80 px-5 py-6 text-center">
          <p className="text-sm text-zinc-500">{emptyLabel}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {materials.map((material) => {
            // Teacher can manage any material in the classroom; everyone
            // else only their own — matches delete_material()'s rule.
            const canManage = isTeacher || material.isMine;

            return (
              <div key={material.id} className="flex items-start gap-3 rounded-2xl border bg-bg-card p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand-primary/20 text-brand-primary">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">{material.title}</h4>
                    <IngestionBadge status={material.ingestionStatus} />
                  </div>

                  {material.description && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {material.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    {material.uploaderName && <span>{material.uploaderName}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {material.createdAt}
                    </span>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-primary hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      Open file
                    </a>
                  </div>
                </div>

                {canManage && (
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(material)}
                      className="text-zinc-500 hover:text-brand-primary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(material)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Upload / edit modal ───────────────────────────────────────────────────────

function MaterialModal({
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
  onSubmit: (title: string, description: string, visibility: Visibility, file: File | null) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && (mode === "edit" || file !== null);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    await onSubmit(title.trim(), description.trim(), visibility, file);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-main">
            {mode === "create" ? "Add material" : "Edit material"}
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-text-main transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

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
                  <span className="truncate text-xs text-zinc-500" title={file.name}>
                    {file.name}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" onClick={onClose} className="rounded-sm bg-transparent text-zinc-500 hover:text-text-main">
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
        </div>
      </div>
    </div>
  );
}