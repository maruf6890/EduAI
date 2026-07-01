"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
    Plus,
    ListChecks,
    Calendar,
    Clock,
    MoreVertical,
    Eye,
    Pencil,
    Trash2,
    X,
    PlayCircle,
    StopCircle,
    BarChart3,
    CircleDashed,
    Timer,
    Trophy,
} from "lucide-react";

/* =========================================================================
   TYPES — mirror your service layer + Pydantic models EXACTLY
   =========================================================================
   Source of truth:
     - CreateQuizInput / UpdateQuizInput / QuestionInput / AnswerInput (Pydantic)
     - create_quiz / update_quiz / get_quizzes_teacher / get_quiz_results (service)
     - endpoint list screenshot (/api/v1/classrooms/{classroom_id}/quizzes/...)

   Every response you return follows: { success, message, data }
   ========================================================================= */

// Teacher-facing question shape (includes correct_option — RETURNING clause
// in create_quiz / add_questions / _get_questions_for_teacher)
interface QuizQuestion {
    id: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string | null;
    option_d: string | null;
    correct_option: "A" | "B" | "C" | "D";
    marks: number;
    order_index: number;
}

// ⚠️ ASSUMED: your service compares status to "ACTIVE" / "ENDED" but never
// shows what the default status is on creation. Using "SCHEDULED" as the
// third state — confirm/rename against your `quizzes.status` DB default.
type QuizStatus = "SCHEDULED" | "ACTIVE" | "ENDED";

// Full quiz shape as returned to the teacher (create_quiz / update_quiz /
// get_quizzes_teacher / start_quiz / end_quiz all RETURNING this column set)
interface Quiz {
    id: number;
    classroom_id: number;
    title: string;
    description: string | null;
    scheduled_at: string | null; // ISO datetime, serialized via _serialize()
    duration_minutes: number;
    total_marks: number;
    is_published: boolean;
    status: QuizStatus;
    created_by: number;
    created_at: string;
    updated_at: string;
    questions: QuizQuestion[];
}

// Matches QuestionInput exactly — used for the create-quiz question builder
interface QuestionFormRow {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: "A" | "B" | "C" | "D";
    marks: number;
    order_index: number;
}

// Matches CreateQuizInput exactly
interface QuizFormState {
    title: string;
    description: string;
    scheduled_at: string; // datetime-local input value -> ISO on submit
    duration_minutes: number;
    is_published: boolean;
    questions: QuestionFormRow[];
}

function emptyQuestionRow(order_index: number): QuestionFormRow {
    return {
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
        marks: 1,
        order_index,
    };
}

const emptyForm: QuizFormState = {
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 30,
    is_published: false,
    questions: [emptyQuestionRow(0)],
};

/* =========================================================================
   DUMMY DATA — same field names as get_quizzes_teacher's `data` array.
   Swap `useState(dummyQuizzes)` for the fetched `json.data` and nothing
   else needs to change.
   ========================================================================= */

const dummyQuizzes: Quiz[] = [
    {
        id: 201,
        classroom_id: 1,
        title: "Genetics Fundamentals",
        description: "Covers Mendelian inheritance, Punnett squares, and genotype vs phenotype.",
        scheduled_at: "2026-07-05T10:00:00.000Z",
        duration_minutes: 20,
        total_marks: 10,
        is_published: true,
        status: "SCHEDULED",
        created_by: 1,
        created_at: "2026-06-24T09:00:00.000Z",
        updated_at: "2026-06-24T09:00:00.000Z",
        questions: [
            {
                id: 1001,
                question_text: "A cross between two heterozygous parents (Aa x Aa) produces what ratio?",
                option_a: "1:2:1",
                option_b: "3:1",
                option_c: "1:1",
                option_d: "9:3:3:1",
                correct_option: "B",
                marks: 5,
                order_index: 0,
            },
            {
                id: 1002,
                question_text: "The physical appearance of an organism is called its:",
                option_a: "Genotype",
                option_b: "Karyotype",
                option_c: "Phenotype",
                option_d: "Allele",
                correct_option: "C",
                marks: 5,
                order_index: 1,
            },
        ],
    },
    {
        id: 202,
        classroom_id: 1,
        title: "Cell Structure Pop Quiz",
        description: null,
        scheduled_at: "2026-07-01T15:00:00.000Z",
        duration_minutes: 15,
        total_marks: 6,
        is_published: true,
        status: "ACTIVE",
        created_by: 1,
        created_at: "2026-06-29T08:00:00.000Z",
        updated_at: "2026-07-01T15:00:00.000Z",
        questions: [
            {
                id: 1003,
                question_text: "Which organelle is known as the powerhouse of the cell?",
                option_a: "Nucleus",
                option_b: "Mitochondria",
                option_c: "Ribosome",
                option_d: "Golgi apparatus",
                correct_option: "B",
                marks: 3,
                order_index: 0,
            },
            {
                id: 1004,
                question_text: "Plant cells, unlike animal cells, contain a:",
                option_a: "Cell wall",
                option_b: "Nucleus",
                option_c: "Cytoplasm",
                option_d: "Cell membrane",
                correct_option: "A",
                marks: 3,
                order_index: 1,
            },
        ],
    },
    {
        id: 203,
        classroom_id: 1,
        title: "Chemical Bonding Review",
        description: "Ionic vs covalent bonds, electronegativity, and Lewis structures.",
        scheduled_at: "2026-06-20T10:00:00.000Z",
        duration_minutes: 25,
        total_marks: 8,
        is_published: true,
        status: "ENDED",
        created_by: 1,
        created_at: "2026-06-14T09:00:00.000Z",
        updated_at: "2026-06-20T10:30:00.000Z",
        questions: [
            {
                id: 1005,
                question_text: "An ionic bond is formed through:",
                option_a: "Sharing of electrons",
                option_b: "Transfer of electrons",
                option_c: "Sharing of protons",
                option_d: "Transfer of neutrons",
                correct_option: "B",
                marks: 4,
                order_index: 0,
            },
            {
                id: 1006,
                question_text: "Which bond type typically forms between two nonmetals?",
                option_a: "Ionic",
                option_b: "Metallic",
                option_c: "Covalent",
                option_d: "Hydrogen",
                correct_option: "C",
                marks: 4,
                order_index: 1,
            },
        ],
    },
    {
        id: 204,
        classroom_id: 1,
        title: "Unit 5 Draft Quiz",
        description: "Still adding questions — not visible to students yet.",
        scheduled_at: "2026-07-10T09:00:00.000Z",
        duration_minutes: 30,
        total_marks: 2,
        is_published: false,
        status: "SCHEDULED",
        created_by: 1,
        created_at: "2026-07-01T12:00:00.000Z",
        updated_at: "2026-07-01T12:00:00.000Z",
        questions: [
            {
                id: 1007,
                question_text: "Placeholder question — replace before publishing.",
                option_a: "Option A",
                option_b: "Option B",
                option_c: null,
                option_d: null,
                correct_option: "A",
                marks: 2,
                order_index: 0,
            },
        ],
    },
];

/* =========================================================================
   HELPERS
   ========================================================================= */

function formatScheduledAt(scheduled_at: string | null): string {
    if (!scheduled_at) return "Not scheduled";
    const date = new Date(scheduled_at);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    }) + `, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function statusStyles(status: QuizStatus): { label: string; className: string; icon: typeof CircleDashed } {
    switch (status) {
        case "ACTIVE":
            return { label: "Active", className: "bg-brand-primary/10 text-brand-primary", icon: PlayCircle };
        case "ENDED":
            return { label: "Ended", className: "bg-zinc-800 text-zinc-400", icon: StopCircle };
        case "SCHEDULED":
        default:
            return { label: "Scheduled", className: "bg-brand-secondary/10 text-brand-secondary", icon: Clock };
    }
}

/* =========================================================================
   PAGE
   ========================================================================= */

export default function QuizzesPage() {
    const params = useParams();
    const classroomId = params?.classroomId as string;

    const [quizzes, setQuizzes] = useState<Quiz[]>(dummyQuizzes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<QuizFormState>(emptyForm);
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

    async function handleCreateQuiz(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        // ---------------------------------------------------------------------
        // TODO: POST /api/v1/classrooms/{classroom_id}/quizzes  (create_quiz)
        //
        // const res = await fetch(`/api/v1/classrooms/${classroomId}/quizzes`, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({
        //     title: form.title,
        //     description: form.description || null,
        //     scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        //     duration_minutes: form.duration_minutes,
        //     is_published: form.is_published,
        //     questions: form.questions.map((q) => ({
        //       question_text: q.question_text,
        //       option_a: q.option_a,
        //       option_b: q.option_b,
        //       option_c: q.option_c || null,
        //       option_d: q.option_d || null,
        //       correct_option: q.correct_option,
        //       marks: q.marks,
        //       order_index: q.order_index,
        //     })),
        //   }),
        // });
        // const json = await res.json(); // { success, message, data: Quiz }
        // setQuizzes((prev) => [json.data, ...prev]);
        // ---------------------------------------------------------------------

        // Temporary local-only insert so the UI is testable without a backend.
        const localQuiz: Quiz = {
            id: Date.now(),
            classroom_id: Number(classroomId) || 0,
            title: form.title,
            description: form.description || null,
            scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
            duration_minutes: form.duration_minutes,
            total_marks: form.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
            is_published: form.is_published,
            status: "SCHEDULED",
            created_by: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            questions: form.questions.map((q, i) => ({
                id: Date.now() + i,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c || null,
                option_d: q.option_d || null,
                correct_option: q.correct_option,
                marks: q.marks,
                order_index: q.order_index,
            })),
        };

        setTimeout(() => {
            setQuizzes((prev) => [localQuiz, ...prev]);
            setIsSubmitting(false);
            setIsModalOpen(false);
        }, 400);
    }

    function handleViewQuiz(quiz: Quiz) {
        // TODO: could route to a dedicated quiz detail page
        console.log("View quiz", quiz.id);
        setOpenMenuId(null);
    }

    function handleEditQuiz(quiz: Quiz) {
        // TODO: PUT /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}  (update_quiz)
        // Only title, description, scheduled_at, duration_minutes, is_published are
        // editable per UpdateQuizInput — questions are managed via the separate
        // add-questions / delete-question endpoints below.
        console.log("Edit quiz", quiz.id);
        setOpenMenuId(null);
    }

    function handleDeleteQuiz(quiz: Quiz) {
        // TODO: DELETE /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}  (delete_quiz)
        // await fetch(`/api/v1/classrooms/${classroomId}/quizzes/${quiz.id}`, { method: "DELETE" });
        setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
        setOpenMenuId(null);
    }

    function handleStartQuiz(quiz: Quiz) {
        // TODO: POST /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}/start  (start_quiz)
        // Backend rejects if status is already ACTIVE or ENDED (see service code).
        setQuizzes((prev) =>
            prev.map((q) => (q.id === quiz.id ? { ...q, status: "ACTIVE", is_published: true } : q))
        );
        setOpenMenuId(null);
    }

    function handleEndQuiz(quiz: Quiz) {
        // TODO: POST /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}/end  (end_quiz)
        // Backend also marks IN_PROGRESS submissions as TIMED_OUT server-side.
        setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? { ...q, status: "ENDED" } : q)));
        setOpenMenuId(null);
    }

    function handleViewResults(quiz: Quiz) {
        // TODO: GET /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}/results  (get_quiz_results)
        // Returns { success, message, data: [{ id, student_id, started_at, submitted_at,
        //   marks_obtained, status, student: { id, full_name, email } }, ...] }
        console.log("View results", quiz.id);
        setOpenMenuId(null);
    }

    // ---------------------------------------------------------------------
    // TODO: GET /api/v1/classrooms/{classroom_id}/quizzes/teacher  (initial load)
    //
    // useEffect(() => {
    //   async function loadQuizzes() {
    //     const res = await fetch(`/api/v1/classrooms/${classroomId}/quizzes/teacher`);
    //     const json = await res.json(); // { success, message, data: Quiz[] }
    //     setQuizzes(json.data);
    //   }
    //   loadQuizzes();
    // }, [classroomId]);
    //
    // Other endpoints available on this resource (not wired into this page yet):
    //   POST   /quizzes/{quiz_id}/questions               add_questions
    //   DELETE /quizzes/{quiz_id}/questions/{question_id}  delete_question
    //   GET    /quizzes/student                            get_quizzes_student
    //   POST   /quizzes/{quiz_id}/take                     start_taking_quiz
    //   POST   /quizzes/{quiz_id}/submit                   submit_quiz
    //   GET    /quizzes/{quiz_id}/my_result                get_my_quiz_result
    // These belong to the student-facing "take quiz" flow and a question-editor
    // sub-view — separate screens from this teacher management page.
    // ---------------------------------------------------------------------

    /* -------------------------------- render ------------------------------- */

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                        <ListChecks className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-100">Quizzes</h1>
                        <p className="text-sm text-zinc-500">
                            {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90 active:opacity-80"
                >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Create quiz
                </button>
            </div>

            {/* Quiz list */}
            {quizzes.length === 0 ? (
                <EmptyState onCreate={handleOpenCreateModal} />
            ) : (
                <div className="flex flex-col gap-3">
                    {quizzes.map((quiz) => (
                        <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            isMenuOpen={openMenuId === quiz.id}
                            onToggleMenu={() => setOpenMenuId((prev) => (prev === quiz.id ? null : quiz.id))}
                            onView={() => handleViewQuiz(quiz)}
                            onEdit={() => handleEditQuiz(quiz)}
                            onDelete={() => handleDeleteQuiz(quiz)}
                            onStart={() => handleStartQuiz(quiz)}
                            onEnd={() => handleEndQuiz(quiz)}
                            onResults={() => handleViewResults(quiz)}
                        />
                    ))}
                </div>
            )}

            {/* Create quiz modal */}
            {isModalOpen && (
                <CreateQuizModal
                    form={form}
                    setForm={setForm}
                    isSubmitting={isSubmitting}
                    onClose={handleCloseModal}
                    onSubmit={handleCreateQuiz}
                />
            )}
        </div>
    );
}

/* =========================================================================
   QUIZ CARD
   ========================================================================= */

function QuizCard({
    quiz,
    isMenuOpen,
    onToggleMenu,
    onView,
    onEdit,
    onDelete,
    onStart,
    onEnd,
    onResults,
}: {
    quiz: Quiz;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onStart: () => void;
    onEnd: () => void;
    onResults: () => void;
}) {
    const status = statusStyles(quiz.status);
    const StatusIcon = status.icon;

    return (
        <div
            onClick={onView}
            className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 sm:items-center sm:p-5"
        >
            {/* Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 sm:h-12 sm:w-12">
                <ListChecks className="h-5 w-5 text-zinc-400" />
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="truncate text-sm font-medium text-zinc-100 sm:text-base">{quiz.title}</h3>

                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </span>

                    {!quiz.is_published && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                            <CircleDashed className="h-3 w-3" />
                            Draft
                        </span>
                    )}
                </div>

                {quiz.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{quiz.description}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatScheduledAt(quiz.scheduled_at)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        {quiz.duration_minutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" />
                        {quiz.total_marks} points
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5" />
                        {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}
                    </span>
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
                    aria-label="Quiz actions"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>

                {isMenuOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40"
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
                            onClick={onResults}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Results
                        </button>

                        {quiz.status !== "ACTIVE" && quiz.status !== "ENDED" && (
                            <button
                                onClick={onStart}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-brand-primary hover:bg-zinc-800"
                            >
                                <PlayCircle className="h-4 w-4" />
                                Start quiz
                            </button>
                        )}

                        {quiz.status === "ACTIVE" && (
                            <button
                                onClick={onEnd}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-amber-400 hover:bg-zinc-800"
                            >
                                <StopCircle className="h-4 w-4" />
                                End quiz
                            </button>
                        )}

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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                <ListChecks className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-zinc-200">No quizzes yet</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Create your first quiz to test what students have learned.
            </p>
            <button
                onClick={onCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90"
            >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Create quiz
            </button>
        </div>
    );
}

/* =========================================================================
   CREATE QUIZ MODAL
   Fields match CreateQuizInput EXACTLY: title*, description, scheduled_at,
   duration_minutes, is_published, questions[] (QuestionInput[])
   ========================================================================= */

function CreateQuizModal({
    form,
    setForm,
    isSubmitting,
    onClose,
    onSubmit,
}: {
    form: QuizFormState;
    setForm: React.Dispatch<React.SetStateAction<QuizFormState>>;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    function updateQuestion(index: number, patch: Partial<QuestionFormRow>) {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
        }));
    }

    function addQuestion() {
        setForm((prev) => ({
            ...prev,
            questions: [...prev.questions, emptyQuestionRow(prev.questions.length)],
        }));
    }

    function removeQuestion(index: number) {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions
                .filter((_, i) => i !== index)
                .map((q, i) => ({ ...q, order_index: i })),
        }));
    }

    const totalMarks = form.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    const isValid =
        form.title.trim().length > 0 &&
        form.duration_minutes > 0 &&
        form.questions.every((q) => q.question_text && q.option_a && q.option_b);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-zinc-800 bg-zinc-900 sm:max-w-2xl sm:rounded-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-zinc-100">Create quiz</h2>
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
                                placeholder="e.g. Genetics Fundamentals"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        {/* description */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="What does this quiz cover?"
                                rows={2}
                                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        {/* scheduled_at + duration_minutes */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Scheduled at</label>
                                <input
                                    type="datetime-local"
                                    value={form.scheduled_at}
                                    onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 [color-scheme:dark] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                    Duration (minutes) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    required
                                    type="number"
                                    min={1}
                                    value={form.duration_minutes}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))
                                    }
                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                            </div>
                        </div>

                        {/* is_published */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                            <label className="flex cursor-pointer items-center justify-between">
                                <span className="text-sm text-zinc-300">Publish immediately</span>
                                <ToggleSwitch
                                    checked={form.is_published}
                                    onChange={(checked) => setForm((prev) => ({ ...prev, is_published: checked }))}
                                />
                            </label>
                        </div>

                        {/* questions */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-medium text-zinc-400">
                                    Questions <span className="text-red-400">*</span>
                                </label>
                                <span className="text-xs text-zinc-500">{totalMarks} total points</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {form.questions.map((question, index) => (
                                    <QuestionRow
                                        key={index}
                                        index={index}
                                        question={question}
                                        onChange={(patch) => updateQuestion(index, patch)}
                                        onRemove={() => removeQuestion(index)}
                                        canRemove={form.questions.length > 1}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addQuestion}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:border-brand-secondary hover:text-brand-secondary"
                            >
                                <Plus className="h-4 w-4" />
                                Add question
                            </button>
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
                        {isSubmitting ? "Creating..." : "Create quiz"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   QUESTION ROW — one entry in the create-quiz question builder
   ========================================================================= */

function QuestionRow({
    index,
    question,
    onChange,
    onRemove,
    canRemove,
}: {
    index: number;
    question: QuestionFormRow;
    onChange: (patch: Partial<QuestionFormRow>) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const options: { key: "A" | "B" | "C" | "D"; field: keyof QuestionFormRow; required: boolean }[] = [
        { key: "A", field: "option_a", required: true },
        { key: "B", field: "option_b", required: true },
        { key: "C", field: "option_c", required: false },
        { key: "D", field: "option_d", required: false },
    ];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-brand-secondary">Question {index + 1}</span>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-zinc-500 hover:text-red-400"
                        aria-label="Remove question"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <input
                required
                type="text"
                value={question.question_text}
                onChange={(e) => onChange({ question_text: e.target.value })}
                placeholder="Question text"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />

            <div className="mt-2 grid grid-cols-2 gap-2">
                {options.map(({ key, field, required }) => (
                    <div key={key} className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onChange({ correct_option: key })}
                            title="Mark as correct answer"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${question.correct_option === key
                                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                    : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                                }`}
                        >
                            {key}
                        </button>
                        <input
                            required={required}
                            type="text"
                            value={question[field] as string}
                            onChange={(e) => onChange({ [field]: e.target.value } as Partial<QuestionFormRow>)}
                            placeholder={`Option ${key}${required ? "" : " (optional)"}`}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-zinc-500">Marks</label>
                <input
                    type="number"
                    min={1}
                    value={question.marks}
                    onChange={(e) => onChange({ marks: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <span className="ml-auto text-xs text-zinc-600">
                    Correct answer: <span className="font-medium text-brand-primary">{question.correct_option}</span>
                </span>
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