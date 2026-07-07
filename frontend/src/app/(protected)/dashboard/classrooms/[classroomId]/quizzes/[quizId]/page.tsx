"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  Play,
  Square,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { private_api_call } from "@/actions/private_api_call";
import { useClassroom } from "../../ClassroomContext";
import {
  Quiz,
  QuizFormState,
  emptyQuizForm,
  QuestionFormState,
  QuizResultRow,
  TakeQuizData,
  MyQuizResult,
} from "../types";
import { formatDateTime, formatDuration, getQuizStatusBadge } from "../QuizHelpers";
import EditQuizDialog from "../EditQuizDialog";
import ManageQuestionsDialog from "./ManageQuestionsDialog";
import QuizResultsPanel from "./QuizResultsPanel";
import TakeQuizView from "./TakeQuizView";
import MyResultCard from "./MyResultCard";

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params?.classroomId as string;
  const quizId = params?.quizId as string;

  const classroom = useClassroom();
  const isTeacher = classroom.current_user.role === "teacher";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Teacher state
  const [results, setResults] = useState<QuizResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<QuizFormState>(emptyQuizForm);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [newQuestions, setNewQuestions] = useState<QuestionFormState[]>([]);
  const [isAddingQuestions, setIsAddingQuestions] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);

  // Student state
  const [myResult, setMyResult] = useState<MyQuizResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [takeData, setTakeData] = useState<TakeQuizData | null>(null);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // ── Load quiz ────────────────────────────────────────────────────────────────
  async function loadQuizForTeacher() {
    setLoading(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/quizzes/teacher`,
      });
      if (res.success) {
        const found = (res.data as Quiz[]).find((q) => q.id === Number(quizId));
        if (found) {
          setQuiz(found);
        } else {
          toast.error("Quiz not found");
        }
      } else {
        toast.error(res.message || "Failed to load quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }

  async function loadQuizForStudent() {
    setLoading(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/quizzes/${quizId}`,
      });
      if (res.success) {
        setQuiz(res.data);
      } else {
        toast.error(res.message || "Failed to load quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }

  async function loadResults() {
    setLoadingResults(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/quizzes/${quizId}/results`,
      });
      if (res.success) {
        setResults(res.data ?? []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoadingResults(false);
    }
  }

  async function loadMyResult() {
    setLoadingResult(true);
    try {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/quizzes/${quizId}/my-result`,
      });
      if (res.success) {
        setMyResult(res.data);
      } else {
        setMyResult(null); // not attempted yet — not an error
      }
    } catch {
      setMyResult(null);
    } finally {
      setLoadingResult(false);
    }
  }

  useEffect(() => {
    if (isTeacher) {
      loadQuizForTeacher();
      loadResults();
    } else {
      loadQuizForStudent();
      loadMyResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, quizId]);

  // ── Teacher: edit ─────────────────────────────────────────────────────────────
  function openEdit() {
    if (!quiz) return;
    setEditForm({
      title: quiz.title,
      description: quiz.description ?? "",
      scheduled_at: quiz.scheduled_at ? quiz.scheduled_at.slice(0, 16) : "",
      duration_minutes: String(quiz.duration_minutes),
      is_published: quiz.is_published,
      questions: [],
    });
    setIsEditOpen(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    setIsEditSubmitting(true);

    try {
      const res = await private_api_call({
        method: "PUT",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}`,
        body: {
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          scheduled_at: editForm.scheduled_at ? new Date(editForm.scheduled_at).toISOString() : null,
          duration_minutes: Number(editForm.duration_minutes) || 30,
          is_published: editForm.is_published,
        },
      });

      if (res.success) {
        setQuiz(res.data);
        setIsEditOpen(false);
        toast.success("Quiz updated successfully");
      } else {
        toast.error(res.message || "Failed to update quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update quiz");
    } finally {
      setIsEditSubmitting(false);
    }
  }

  // ── Teacher: manage questions ─────────────────────────────────────────────────
  function openManageQuestions() {
    setNewQuestions([]);
    setIsManageOpen(true);
  }

  async function handleAddQuestions(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    setIsAddingQuestions(true);

    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/questions`,
        body: newQuestions.map((q, index) => ({
          question_text: q.question_text.trim(),
          option_a: q.option_a.trim(),
          option_b: q.option_b.trim(),
          option_c: q.option_c.trim() || null,
          option_d: q.option_d.trim() || null,
          correct_option: q.correct_option,
          marks: Number(q.marks) || 1,
          order_index: quiz.questions.length + index + 1,
        })),
      });

      if (res.success) {
        setQuiz((prev) =>
          prev
            ? { ...prev, questions: [...prev.questions, ...res.data.questions], total_marks: res.data.total_marks }
            : prev
        );
        setNewQuestions([]);
        toast.success("Questions added successfully");
      } else {
        toast.error(res.message || "Failed to add questions");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add questions");
    } finally {
      setIsAddingQuestions(false);
    }
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!quiz) return;
    setDeletingQuestionId(questionId);

    try {
      const res = await private_api_call({
        method: "DELETE",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/questions/${questionId}`,
      });

      if (res.success) {
        setQuiz((prev) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.filter((q) => q.id !== questionId),
                total_marks: res.data.total_marks,
              }
            : prev
        );
        toast.success("Question deleted");
      } else {
        toast.error(res.message || "Failed to delete question");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete question");
    } finally {
      setDeletingQuestionId(null);
    }
  }

  // ── Teacher: start / end / delete ─────────────────────────────────────────────
  async function handleStart() {
    if (!quiz) return;
    setIsStartingQuiz(true);
    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/start`,
      });
      if (res.success) {
        setQuiz(res.data);
        toast.success("Quiz started — students can now take it");
      } else {
        toast.error(res.message || "Failed to start quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setIsStartingQuiz(false);
    }
  }

  async function handleEnd() {
    if (!quiz) return;
    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/end`,
      });
      if (res.success) {
        setQuiz(res.data);
        toast.success("Quiz ended");
        loadResults();
      } else {
        toast.error(res.message || "Failed to end quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end quiz");
    }
  }

  async function handleDelete() {
    if (!quiz) return;
    try {
      const res = await private_api_call({
        method: "DELETE",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}`,
      });
      if (res.success) {
        toast.success("Quiz deleted");
        router.push(`/dashboard/classrooms/${classroomId}/quizzes`);
      } else {
        toast.error(res.message || "Failed to delete quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete quiz");
    }
  }

  // ── Student: take quiz ─────────────────────────────────────────────────────────
  async function handleStartTaking() {
    if (!quiz) return;
    setIsStartingQuiz(true);
    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/take`,
      });
      if (res.success) {
        setTakeData(res.data);
      } else {
        toast.error(res.message || "Failed to start quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setIsStartingQuiz(false);
    }
  }

  async function handleSubmitQuiz(answers: { question_id: number; selected_option: string }[]) {
    if (!quiz) return;
    setIsSubmittingQuiz(true);
    try {
      const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/quizzes/${quiz.id}/submit`,
        body: { answers },
      });
      if (res.success) {
        toast.success("Quiz submitted successfully");
        setTakeData(null);
        loadMyResult();
      } else {
        toast.error(res.message || "Failed to submit quiz");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setIsSubmittingQuiz(false);
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

  if (!quiz) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  const badge = getQuizStatusBadge(quiz.status);

  // Student is actively taking the quiz — full-screen replace
  if (!isTeacher && takeData) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <TakeQuizView data={takeData} isSubmitting={isSubmittingQuiz} onSubmit={handleSubmitQuiz} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <button
        onClick={() => router.push(`/dashboard/classrooms/${classroomId}/quizzes`)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quizzes
      </button>

      {/* Quiz header */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{quiz.title}</h1>
              <Badge variant="secondary" className={badge.className}>
                {badge.label}
              </Badge>
            </div>

            {quiz.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{quiz.description}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateTime(quiz.scheduled_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(quiz.duration_minutes)}
              </span>
              {quiz.total_marks > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {quiz.total_marks} points · {quiz.questions.length} questions
                </span>
              )}
            </div>
          </div>

          {isTeacher && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {quiz.status === "DRAFT" && (
                <>
                  <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={openManageQuestions} className="gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" />
                    Questions
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleStart}
                    disabled={isStartingQuiz || quiz.questions.length === 0}
                    className="gap-1.5 bg-[#8168f3] text-white hover:bg-[#6f57e0]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isStartingQuiz ? "Starting..." : "Start quiz"}
                  </Button>
                </>
              )}

              {quiz.status === "ACTIVE" && (
                <Button variant="outline" size="sm" onClick={handleEnd} className="gap-1.5">
                  <Square className="h-3.5 w-3.5" />
                  End quiz
                </Button>
              )}

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
      </div>

      {/* Teacher: results */}
      {isTeacher && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Results {results.length > 0 && `(${results.length})`}
          </h2>
          {loadingResults ? (
            <Skeleton className="h-20 rounded-2xl" />
          ) : (
            <QuizResultsPanel results={results} totalMarks={quiz.total_marks} />
          )}
        </div>
      )}

      {/* Student: attempt / result */}
      {!isTeacher && (
        <div className="mt-6">
          {loadingResult ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : myResult ? (
            <MyResultCard result={myResult} totalMarks={quiz.total_marks} />
          ) : quiz.status === "ACTIVE" ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                This quiz is live now. You have {formatDuration(quiz.duration_minutes)} once you start.
              </p>
              <Button
                onClick={handleStartTaking}
                disabled={isStartingQuiz}
                className="mt-4 bg-[#8168f3] text-white hover:bg-[#6f57e0]"
              >
                {isStartingQuiz ? "Starting..." : "Start quiz"}
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {quiz.status === "ENDED"
                  ? "This quiz has ended and you did not attempt it."
                  : "This quiz hasn't started yet."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit dialog */}
      <EditQuizDialog
        open={isEditOpen}
        form={editForm}
        setForm={setEditForm}
        isSubmitting={isEditSubmitting}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
      />

      {/* Manage questions dialog */}
      <ManageQuestionsDialog
        open={isManageOpen}
        existingQuestions={quiz.questions}
        newQuestions={newQuestions}
        setNewQuestions={setNewQuestions}
        isSubmitting={isAddingQuestions}
        isDeletingId={deletingQuestionId}
        onClose={() => setIsManageOpen(false)}
        onAddQuestions={handleAddQuestions}
        onDeleteQuestion={handleDeleteQuestion}
      />
    </div>
  );
}