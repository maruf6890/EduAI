"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { private_api_call } from "@/actions/private_api_call";
import { private_upload_call } from "@/actions/private_upload_call";
import { useClassroom } from "../ClassroomContext";
import { Assignment, AssignmentFormState, emptyForm } from "./types";
import AssignmentCard from "./AssignmentCard";
import CreateAssignmentDialog from "./CreateAssignmentDialog";
import EditAssignmentDialog from "./EditAssignmentDialog";
import EmptyState from "./EmptyState";
import PageTitle from "../materials/PageTitle";

export default function AssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params?.classroomId as string;
  const classroom = useClassroom();
  const isTeacher = classroom.current_user.role === "teacher";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<AssignmentFormState>(emptyForm);

  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editForm, setEditForm] = useState<AssignmentFormState>(emptyForm);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // ── Load assignments — SAME call for teacher and student ──────────────────
  async function loadAssignments() {
    setLoading(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/assignments`,
      });
      if (res.success) {
        setAssignments(res.data ?? []);
      } else {
        toast.error(res.message || "Failed to load assignments");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const load = async () => {
      await loadAssignments();
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.append("title", form.title);
      if (form.description) body.append("description", form.description);
      if (form.total_marks) body.append("total_marks", form.total_marks);
      if (form.due_date) body.append("due_date", new Date(form.due_date).toISOString());
      body.append("allow_late_submission", String(form.allow_late_submission));
      body.append("is_published", String(form.is_published));
      form.files.forEach((file) => body.append("files", file));

      const res = await private_upload_call({
        method: "POST",
        path: `classrooms/${classroomId}/assignments`,
        body,
      });

      if (res.success) {
        setAssignments((prev) => [res.data, ...prev]);
        setForm(emptyForm);
        setIsCreateOpen(false);
        toast.success("Assignment created successfully");
      } else {
        toast.error(res.message || "Failed to create assignment");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  function openEdit(assignment: Assignment) {
    setEditingAssignment(assignment);
    setEditForm({
      title: assignment.title,
      description: assignment.description ?? "",
      total_marks: String(assignment.total_marks ?? ""),
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : "",
      allow_late_submission: assignment.allow_late_submission,
      is_published: assignment.is_published,
      files: [],
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAssignment) return;
    setIsEditSubmitting(true);

    try {
      const res = await private_api_call({
        method: "PUT",
        path: `classrooms/${classroomId}/assignments/${editingAssignment.id}`,
        body: {
          title: editForm.title,
          description: editForm.description || null,
          total_marks: editForm.total_marks ? Number(editForm.total_marks) : null,
          due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
          allow_late_submission: editForm.allow_late_submission,
          is_published: editForm.is_published,
        },
      });

      if (res.success) {
        setAssignments((prev) => prev.map((a) => (a.id === editingAssignment.id ? res.data : a)));
        setEditingAssignment(null);
        toast.success("Assignment updated successfully");
      } else {
        toast.error(res.message || "Failed to update assignment");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update assignment");
    } finally {
      setIsEditSubmitting(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(assignment: Assignment) {
    try {
      const res = await private_api_call({
        method: "DELETE",
        path: `classrooms/${classroomId}/assignments/${assignment.id}`,
      });
      if (res.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
        toast.success("Assignment deleted");
      } else {
        toast.error(res.message || "Failed to delete assignment");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete assignment");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setForm((prev) => ({ ...prev, files: [...prev.files, ...Array.from(e.target.files!)] }));
  }

  function handleRemoveFile(index: number) {
    setForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center items-center sm:justify-between">
        <PageTitle title="Assignments" icon={ClipboardList} />

        {isTeacher && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full gap-2 bg-[#8168f3] text-white hover:bg-[#6f57e0] sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create assignment
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          onCreate={isTeacher ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isTeacher={isTeacher}
              onView={() =>
                router.push(
                  `/dashboard/classrooms/${classroomId}/assignments/${assignment.id}`,
                )
              }
              onEdit={() => openEdit(assignment)}
              onDelete={() => handleDelete(assignment)}
            />
          ))}
        </div>
      )}

      <CreateAssignmentDialog
        open={isCreateOpen}
        form={form}
        setForm={setForm}
        isSubmitting={isSubmitting}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
      />

      <EditAssignmentDialog
        open={!!editingAssignment}
        form={editForm}
        setForm={setEditForm}
        isSubmitting={isEditSubmitting}
        onClose={() => setEditingAssignment(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}