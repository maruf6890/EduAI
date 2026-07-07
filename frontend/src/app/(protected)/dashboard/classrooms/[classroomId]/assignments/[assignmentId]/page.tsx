"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  CircleDashed,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { private_api_call } from "@/actions/private_api_call";
import { private_upload_call } from "@/actions/private_upload_call";
import { useClassroom } from "../../ClassroomContext";
import {
  Assignment,
  AssignmentFormState,
  emptyForm,
  Submission,
  SubmissionWithStudent,
} from "../types";
import { formatDueDate, isOverdue } from "../AssignmentHelpers";
import EditAssignmentDialog from "../EditAssignmentDialog";
import AssignmentFilesList from "./AssignmentFilesList";
import SubmitAssignmentDialog from "./SubmitAssignmentDialog";
import MySubmissionCard from "./MySubmissionCard";
import TeacherSubmissionsPanel from "./TeacherSubmissionsPanel";
import GradeSubmissionDialog from "./GradeSubmissionDialog";

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params?.classroomId as string;
  const assignmentId = params?.assignmentId as string;

  const classroom = useClassroom();
  const isTeacher = classroom.current_user.role === "teacher";

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  // Student — own submission
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // Teacher — all submissions
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Edit assignment
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<AssignmentFormState>(emptyForm);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Submit dialog (student)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grade dialog (teacher)
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionWithStudent | null>(null);
  const [marksObtained, setMarksObtained] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  // ── Load assignment ─────────────────────────────────────────────────────────
  async function loadAssignment() {
    setLoading(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/assignments/${assignmentId}`,
      });
      if (res.success) {
        setAssignment(res.data);
      } else {
        toast.error(res.message || "Failed to load assignment");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  }

  // ── Load my submission (student) ────────────────────────────────────────────
  async function loadMySubmission() {
    setLoadingSubmission(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/assignments/${assignmentId}/my-submission`,
      });
      if (res.success) {
        setMySubmission(res.data);
      } else {
        setMySubmission(null); // no submission yet — not an error
      }
    } catch {
      setMySubmission(null);
    } finally {
      setLoadingSubmission(false);
    }
  }

  // ── Load all submissions (teacher) ──────────────────────────────────────────
  async function loadSubmissions() {
    setLoadingSubmissions(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/assignments/${assignmentId}/submissions`,
      });
      if (res.success) {
        setSubmissions(res.data ?? []);
      } else {
        toast.error(res.message || "Failed to load submissions");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  }

  useEffect(() => {
    loadAssignment();
    if (isTeacher) {
      loadSubmissions();
    } else {
      loadMySubmission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, assignmentId]);

  // ── Edit assignment ──────────────────────────────────────────────────────────
  function openEdit() {
    if (!assignment) return;
    setEditForm({
      title: assignment.title,
      description: assignment.description ?? "",
      total_marks: String(assignment.total_marks ?? ""),
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : "",
      allow_late_submission: assignment.allow_late_submission,
      is_published: assignment.is_published,
      files: [],
    });
    setIsEditOpen(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;
    setIsEditSubmitting(true);

    try {
      const res = await private_api_call({
        method: "PUT",
        path: `classrooms/${classroomId}/assignments/${assignment.id}`,
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
        setAssignment(res.data);
        setIsEditOpen(false);
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

  // ── Delete assignment ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!assignment) return;
    try {
      const res = await private_api_call({
        method: "DELETE",
        path: `classrooms/${classroomId}/assignments/${assignment.id}`,
      });
      if (res.success) {
        toast.success("Assignment deleted");
        router.push(`/dashboard/classrooms/${classroomId}/assignment`);
      } else {
        toast.error(res.message || "Failed to delete assignment");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete assignment");
    }
  }

  // ── Submit assignment (student) ─────────────────────────────────────────────
  function openSubmit() {
    setSubmissionText(mySubmission?.submission_text ?? "");
    setSubmissionFiles([]);
    setIsSubmitOpen(true);
  }

  function handleSubmissionFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setSubmissionFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  }

  function handleRemoveSubmissionFile(index: number) {
    setSubmissionFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = new FormData();
      if (submissionText.trim()) body.append("submission_text", submissionText.trim());
      submissionFiles.forEach((file) => body.append("files", file));

      const res = await private_upload_call({
        method: "POST",
        path: `classrooms/${classroomId}/assignments/${assignmentId}/submit`,
        body,
      });

      if (res.success) {
        setMySubmission(res.data);
        setIsSubmitOpen(false);
        toast.success("Assignment submitted successfully");
      } else {
        toast.error(res.message || "Failed to submit assignment");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Grade submission (teacher) ──────────────────────────────────────────────
  function openGrade(submission: SubmissionWithStudent) {
    setGradingSubmission(submission);
    setMarksObtained(submission.marks_obtained !== null ? String(submission.marks_obtained) : "");
    setFeedback(submission.feedback ?? "");
  }

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!gradingSubmission) return;
    setIsGrading(true);

    try {
      const res = await private_api_call({
        method: "PUT",
        path: `classrooms/${classroomId}/assignments/${assignmentId}/submissions/${gradingSubmission.student_id}/grade`,
        body: {
          marks_obtained: Number(marksObtained),
          feedback: feedback.trim() || null,
        },
      });

      if (res.success) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.student_id === gradingSubmission.student_id
              ? { ...s, ...res.data, student: s.student }
              : s
          )
        );
        setGradingSubmission(null);
        toast.success("Submission graded successfully");
      } else {
        toast.error(res.message || "Failed to grade submission");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grade submission");
    } finally {
      setIsGrading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-40 rounded-2xl" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Assignment not found.</p>
      </div>
    );
  }

  const overdue = isOverdue(assignment.due_date) && assignment.is_published;
  const canSubmit = assignment.is_published && (!isOverdue(assignment.due_date) || assignment.allow_late_submission);

  return (
    <div className="px-4 py-6 sm:px-6">

      {/* Back link */}
      <button
        onClick={() => router.push(`/dashboard/classrooms/${classroomId}/assignments`)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assignments
      </button>

      {/* Assignment header */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{assignment.title}</h1>
              {!assignment.is_published && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                >
                  <CircleDashed className="h-3 w-3" />
                  Draft
                </Badge>
              )}
            </div>

            {assignment.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {assignment.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className={`inline-flex items-center gap-1.5 ${overdue ? "text-red-500" : ""}`}>
                <Calendar className="h-4 w-4" />
                {formatDueDate(assignment.due_date)}
              </span>
              {assignment.total_marks !== null && assignment.total_marks > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {assignment.total_marks} points
                </span>
              )}
              {assignment.allow_late_submission && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Late submissions allowed
                </span>
              )}
            </div>
          </div>

          {isTeacher && (
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {assignment.files.length > 0 && (
          <>
            <Separator className="my-5" />
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Attachments</h3>
              <AssignmentFilesList files={assignment.files} />
            </div>
          </>
        )}
      </div>

      {/* Student section */}
      {!isTeacher && (
        <div className="mt-6">
          {loadingSubmission ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : mySubmission ? (
            <MySubmissionCard
              submission={mySubmission}
              totalMarks={assignment.total_marks}
              canResubmit={canSubmit}
              onResubmit={openSubmit}
            />
          ) : canSubmit ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-sm text-muted-foreground">You haven&apos;t submitted this assignment yet.</p>
              <Button onClick={openSubmit} className="mt-4 bg-[#8168f3] text-white hover:bg-[#6f57e0]">
                Submit assignment
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {assignment.is_published ? "The due date has passed and late submissions are not allowed." : "This assignment is not yet published."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Teacher section */}
      {isTeacher && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Submissions {submissions.length > 0 && `(${submissions.length})`}
          </h2>
          {loadingSubmissions ? (
            <div className="flex flex-col gap-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <TeacherSubmissionsPanel
              submissions={submissions}
              totalMarks={assignment.total_marks}
              onGrade={openGrade}
            />
          )}
        </div>
      )}

      {/* Edit dialog */}
      <EditAssignmentDialog
        open={isEditOpen}
        form={editForm}
        setForm={setEditForm}
        isSubmitting={isEditSubmitting}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
      />

      {/* Submit dialog (student) */}
      <SubmitAssignmentDialog
        open={isSubmitOpen}
        submissionText={submissionText}
        setSubmissionText={setSubmissionText}
        files={submissionFiles}
        onFileChange={handleSubmissionFileChange}
        onRemoveFile={handleRemoveSubmissionFile}
        isSubmitting={isSubmitting}
        isResubmit={!!mySubmission}
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Grade dialog (teacher) */}
      <GradeSubmissionDialog
        open={!!gradingSubmission}
        submission={gradingSubmission}
        totalMarks={assignment.total_marks}
        marksObtained={marksObtained}
        setMarksObtained={setMarksObtained}
        feedback={feedback}
        setFeedback={setFeedback}
        isSubmitting={isGrading}
        onClose={() => setGradingSubmission(null)}
        onSubmit={handleGrade}
      />
    </div>
  );
}