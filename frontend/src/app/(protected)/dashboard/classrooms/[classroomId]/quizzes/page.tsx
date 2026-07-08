"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { private_api_call } from "@/actions/private_api_call";
import { useClassroom } from "../ClassroomContext";
import {
  Quiz,
  QuizListItem,
  QuizFormState,
  emptyQuizForm,
  StudentSubmissionSummary,
} from "./types";
import QuizCard from "./QuizCard";
import CreateQuizDialog from "./CreateQuizDialog";
import EditQuizDialog from "./EditQuizDialog";
import EmptyState from "./EmptyState";
import MySubmissionsSummary from "./MySubmissionsSummary";
import PageTitle from "../materials/PageTitle";

export default function QuizzesPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params?.classroomId as string;
  const classroom = useClassroom();
  const isTeacher = classroom.current_user.role === "teacher";

  const [quizzes, setQuizzes] = useState<(Quiz | QuizListItem)[]>([]);
  const [loading, setLoading] = useState(true);
  const [mySubmissions, setMySubmissions] = useState<StudentSubmissionSummary[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<QuizFormState>(emptyQuizForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editingQuiz, setEditingQuiz] = useState<Quiz | QuizListItem | null>(null);
  const [editForm, setEditForm] = useState<QuizFormState>(emptyQuizForm);
  const [isEditing, setIsEditing] = useState(false);

  async function loadQuizzes() {
    setLoading(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/quizzes/${isTeacher ? "teacher" : "student"}`,
      });
      if (res.success) {
        setQuizzes(res.data ?? []);
      } else {
        toast.error(res.message || "Failed to load quizzes");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }

  async function loadMySubmissions() {
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/submissions`,
      });
      if (res.success) {
        setMySubmissions(res.data ?? []);
      }
    } catch {
      // silent — this is a nice-to-have summary, not critical
    }
  }

  useEffect(() => {
    const load = async () => {
      loadQuizzes();
    };
    async function loadSubmissions() {
      if (!isTeacher) {
        await loadMySubmissions();
      }
    }
    load();
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes`,
        body: {
          title: createForm.title.trim(),
          description: createForm.description.trim() || null,
          scheduled_at: createForm.scheduled_at ? new Date(createForm.scheduled_at).toISOString() : null,
          duration_minutes: Number(createForm.duration_minutes) || 30,
          is_published: createForm.is_published,
          questions: createForm.questions.map((q, index) => ({
            question_text: q.question_text.trim(),
            option_a: q.option_a.trim(),
            option_b: q.option_b.trim(),
            option_c: q.option_c.trim() || null,
            option_d: q.option_d.trim() || null,
            correct_option: q.correct_option,
            marks: Number(q.marks) || 1,
            order_index: index + 1,
          })),
        },
      });

      if (res.success) {
        setQuizzes((prev) => [res.data, ...prev]);
        setCreateForm(emptyQuizForm);
        setIsCreateOpen(false);
        toast.success("Quiz created successfully");
      } else {
        toast.error(res.message || "Failed to create quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create quiz");
    } finally {
      setIsCreating(false);
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  function openEdit(quiz: Quiz | QuizListItem) {
    setEditingQuiz(quiz);
    setEditForm({
      title: quiz.title,
      description: quiz.description ?? "",
      scheduled_at: quiz.scheduled_at ? quiz.scheduled_at.slice(0, 16) : "",
      duration_minutes: String(quiz.duration_minutes),
      is_published: "is_published" in quiz ? quiz.is_published : false,
      questions: [],
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuiz) return;
    setIsEditing(true);

    try {
      const res = await private_api_call({
        method: "PUT",
        path: `classrooms/${classroomId}/quizzes/${editingQuiz.id}`,
        body: {
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          scheduled_at: editForm.scheduled_at ? new Date(editForm.scheduled_at).toISOString() : null,
          duration_minutes: Number(editForm.duration_minutes) || 30,
          is_published: editForm.is_published,
        },
      });

      if (res.success) {
        setQuizzes((prev) => prev.map((q) => (q.id === editingQuiz.id ? res.data : q)));
        setEditingQuiz(null);
        toast.success("Quiz updated successfully");
      } else {
        toast.error(res.message || "Failed to update quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update quiz");
    } finally {
      setIsEditing(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(quiz: Quiz | QuizListItem) {
    try {
      const res = await private_api_call({
        method: "DELETE",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}`,
      });
      if (res.success) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
        toast.success("Quiz deleted");
      } else {
        toast.error(res.message || "Failed to delete quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete quiz");
    }
  }

  // ── Start / End ──────────────────────────────────────────────────────────────
  async function handleStart(quiz: Quiz | QuizListItem) {
    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/start`,
      });
      if (res.success) {
        setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? res.data : q)));
        toast.success("Quiz started — students can now take it");
      } else {
        toast.error(res.message || "Failed to start quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start quiz");
    }
  }

  async function handleEnd(quiz: Quiz | QuizListItem) {
    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/end`,
      });
      if (res.success) {
        setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? res.data : q)));
        toast.success("Quiz ended");
      } else {
        toast.error(res.message || "Failed to end quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end quiz");
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <PageTitle title="Quizzes" icon={ListChecks} />

        {isTeacher && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full gap-2 bg-[#8168f3] text-white hover:bg-[#6f57e0] sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create quiz
          </Button>
        )}
      </div>

      {!isTeacher && <MySubmissionsSummary submissions={mySubmissions} />}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState onCreate={isTeacher ? () => setIsCreateOpen(true) : undefined} />
      ) : (
        <div className="flex flex-col gap-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              isTeacher={isTeacher}
              onView={() => router.push(`/dashboard/classrooms/${classroomId}/quizzes/${quiz.id}`)}
              onEdit={() => openEdit(quiz)}
              onDelete={() => handleDelete(quiz)}
              onStart={() => handleStart(quiz)}
              onEnd={() => handleEnd(quiz)}
              onManageQuestions={() =>
                router.push(`/dashboard/classrooms/${classroomId}/quizzes/${quiz.id}`)
              }
              onViewResults={() =>
                router.push(`/dashboard/classrooms/${classroomId}/quizzes/${quiz.id}`)
              }
            />
          ))}
        </div>
      )}

      <CreateQuizDialog
        open={isCreateOpen}
        form={createForm}
        setForm={setCreateForm}
        isSubmitting={isCreating}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <EditQuizDialog
        open={!!editingQuiz}
        form={editForm}
        setForm={setEditForm}
        isSubmitting={isEditing}
        onClose={() => setEditingQuiz(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}