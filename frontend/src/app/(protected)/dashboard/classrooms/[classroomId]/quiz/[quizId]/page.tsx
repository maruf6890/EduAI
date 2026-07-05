"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getQuiz,
    takeQuiz,
    submitQuiz,
    type QuizDetailsData,
    type QuizQuestion,
    type QuizOption,
    type SubmitAnswerInput,
} from "@/actions/dashboard/quiz_attempt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    Clock,
    ListChecks,
    Loader2,
    Send,
} from "lucide-react";

interface PageProps {
    params: Promise<{ classroomId: string; quizId: string }>;
}

const OPTION_KEYS: { key: QuizOption; field: keyof QuizQuestion }[] = [
    { key: "A", field: "option_a" },
    { key: "B", field: "option_b" },
    { key: "C", field: "option_c" },
    { key: "D", field: "option_d" },
];

export default function TakeQuizPage() {

    const params = useParams<{
        classroomId: string;
        quizId: string;
    }>();
    const classroomId = params.classroomId;
    const quizId = params.quizId;
    const router = useRouter();

    // Initial page load (GET quiz, read-only, no attempt created yet)
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState<QuizDetailsData | null>(null);

    // Whether the student has actually clicked "Start quiz" (POST /take called)
    const [quizStarted, setQuizStarted] = useState(false);
    const [starting, setStarting] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<number, QuizOption>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    const autoSubmitTriggered = useRef(false);

    // Load the quiz (read-only) on first render. Does NOT start an attempt.
    useEffect(() => {
        let active = true;

        (async () => {
            setLoading(true);
            setError(null);

            const res = await getQuiz(classroomId, quizId);

            if (!active) return;

            console.log(res);

            if (!res.success || !res.data) {
                setError(res.message || "Couldn't load this quiz.");
                setLoading(false);
                return;
            }

            setQuiz(res.data);
            setLoading(false);
        })();

        return () => {
            active = false;
        };
    }, [classroomId, quizId]);

    async function handleStartQuiz() {
        setStarting(true);
        setError(null);

        const res = await takeQuiz(classroomId, quizId);

        if (!res.success || !res.data) {
            setError(res.message || "Couldn't start quiz.");
            setStarting(false);
            return;
        }

        setQuestions(res.data.questions);
        setDurationMinutes(res.data.duration_minutes);

        if (res.data.duration_minutes) {
            setSecondsLeft(res.data.duration_minutes * 60);
        }

        setQuizStarted(true);
        setStarting(false);
    }


    const handleSubmit = useCallback(async () => {
        if (submitting || submitted) return;
        setSubmitting(true);
        setError(null);

        const payload: SubmitAnswerInput[] = Object.entries(answers).map(
            ([questionId, selected_option]) => ({
                question_id: Number(questionId),
                selected_option,
            })
        );

        const res = await submitQuiz(classroomId, quizId, payload);

        if (!res.success) {
            setError(res.message || "Submitting your quiz failed. Please try again.");
            setSubmitting(false);
            return;
        }

        setSubmitted(true);
        // router.push(`/dashboard/classrooms/${classroomId}/submissions/${submissionId}`);
        router.push(`/dashboard/classrooms/${classroomId}/quiz/${quizId}/submissions/${res.data.id}`);
    }, [answers, classroomId, quizId, router, submitting, submitted]);

    // Countdown timer; only runs once the quiz has actually started.
    useEffect(() => {
        if (!quizStarted || secondsLeft === null || submitted) return;

        if (secondsLeft <= 0) {
            if (!autoSubmitTriggered.current) {
                autoSubmitTriggered.current = true;
                handleSubmit();
            }
            return;
        }

        const id = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
        return () => clearTimeout(id);
    }, [quizStarted, secondsLeft, submitted, handleSubmit]);

    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    const formattedTime = useMemo(() => {
        if (secondsLeft === null) return null;
        const m = Math.floor(secondsLeft / 60)
            .toString()
            .padStart(2, "0");
        const s = (secondsLeft % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }, [secondsLeft]);

    const isLowTime = secondsLeft !== null && secondsLeft <= 60;

    function selectOption(questionId: number, option: QuizOption) {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [questionId]: option }));
    }

    function goTo(index: number) {
        if (index < 0 || index >= totalQuestions) return;
        setCurrentIndex(index);
    }

    // ── Loading state (initial GET quiz) ────────────────────────────────────
    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <Skeleton className="mb-6 h-8 w-64 rounded-xl" />
                <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                    <Card className="rounded-xl">
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    // ── Error state (quiz failed to load, or start failed and no attempt exists) ──
    if (error && !quiz && !quizStarted) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold">Couldn't load this quiz</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => router.push(`/dashboard/classrooms/${classroomId}/quizzes`)}
                >
                    Back to quizzes
                </Button>
            </div>
        );
    }

    // ── Pre-start overview: quiz loaded, attempt not started yet ────────────
    if (quiz && !quizStarted) {
        const questionCount = quiz.questions?.length ?? 0;

        return (
            <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-10 md:py-16">
                <Card className="w-full rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-xl">
                            <span>{quiz.title}</span>
                            <Badge
                                variant="outline"
                                className={`rounded-lg ${quiz.status === "ACTIVE"
                                    ? "border-brand-secondary/30 text-brand-secondary"
                                    : "border-muted-foreground/30 text-muted-foreground"
                                    }`}
                            >
                                {quiz.status}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {quiz.description && (
                            <p className="text-sm text-muted-foreground">{quiz.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-border px-4 py-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ListChecks className="h-3.5 w-3.5" />
                                    Questions
                                </div>
                                <p className="mt-1 text-lg font-semibold text-brand-primary">
                                    {questionCount}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border px-4 py-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    Duration
                                </div>
                                <p className="mt-1 text-lg font-semibold text-brand-primary">
                                    {quiz.duration_minutes} min
                                </p>
                            </div>
                            <div className="rounded-xl border border-border px-4 py-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Total marks
                                </div>
                                <p className="mt-1 text-lg font-semibold text-brand-primary">
                                    {quiz.total_marks}
                                </p>
                            </div>
                        </div>

                        {quiz.scheduled_at && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarClock className="h-3.5 w-3.5" />
                                Scheduled for {new Date(quiz.scheduled_at).toLocaleString()}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
                                    disabled={starting || !quiz.is_published || questionCount === 0}
                                >
                                    {starting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Starting…
                                        </>
                                    ) : (
                                        "Start quiz"
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Start this quiz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Once you start, the {quiz.duration_minutes}-minute timer begins
                                        immediately and can't be paused.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Not yet</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="rounded-xl bg-brand-primary hover:bg-brand-primary/90"
                                        onClick={handleStartQuiz}
                                    >
                                        Start quiz
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {!quiz.is_published && (
                            <p className="text-center text-xs text-muted-foreground">
                                This quiz isn't published yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Empty state (attempt started but no questions returned) ────────────
    if (quizStarted && totalQuestions === 0) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary/10">
                    <ListChecks className="h-6 w-6 text-brand-secondary" />
                </div>
                <h2 className="text-lg font-semibold">No questions yet</h2>
                <p className="text-sm text-muted-foreground">
                    This quiz doesn't have any questions to answer right now.
                </p>
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => router.push(`/dashboard/classrooms/${classroomId}/quizzes`)}
                >
                    Back to quizzes
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-brand-primary md:text-2xl">Quiz</h1>
                    <p className="text-sm text-muted-foreground">
                        Question {currentIndex + 1} of {totalQuestions}
                    </p>
                </div>

                {formattedTime && (
                    <Badge
                        variant="outline"
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm ${isLowTime ? "border-red-300 bg-red-50 text-red-600" : "border-brand-primary/20 text-brand-primary"
                            }`}
                    >
                        <Clock className="h-4 w-4" />
                        {formattedTime}
                    </Badge>
                )}
            </div>

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                {/* Question card */}
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-3 text-base">
                            <span>{currentQuestion.question_text}</span>
                            <Badge variant="secondary" className="shrink-0 rounded-lg">
                                {currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {OPTION_KEYS.map(({ key, field }) => {
                            const optionText = currentQuestion[field] as string;
                            const isSelected = answers[currentQuestion.id] === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    disabled={submitted}
                                    onClick={() => selectOption(currentQuestion.id, key)}
                                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isSelected
                                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                        : "border-border hover:border-brand-primary/40 hover:bg-muted/50"
                                        }`}
                                >
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${isSelected
                                            ? "border-brand-primary bg-brand-primary text-white"
                                            : "border-muted-foreground/30 text-muted-foreground"
                                            }`}
                                    >
                                        {key}
                                    </span>
                                    <span className="flex-1">{optionText}</span>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-primary" />}
                                </button>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Sidebar navigator */}
                <div className="space-y-4">
                    <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle className="text-sm">Question navigator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-2 md:grid-cols-4">
                                {questions.map((q, idx) => {
                                    const isAnswered = answers[q.id] !== undefined;
                                    const isCurrent = idx === currentIndex;
                                    return (
                                        <button
                                            key={q.id}
                                            type="button"
                                            onClick={() => goTo(idx)}
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${isCurrent
                                                ? "bg-brand-primary text-white"
                                                : isAnswered
                                                    ? "bg-brand-secondary/15 text-brand-secondary"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-secondary" />
                                    Answered ({answeredCount})
                                </div>
                                <div className="flex items-center gap-2">
                                    <Circle className="h-3.5 w-3.5" />
                                    Unanswered ({unansweredCount})
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="w-full rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
                                disabled={submitting || submitted}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {submitting ? "Submitting…" : "Submit quiz"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Submit this quiz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {unansweredCount > 0
                                        ? `You still have ${unansweredCount} unanswered ${unansweredCount === 1 ? "question" : "questions"
                                        }. Once submitted, you can't change your answers.`
                                        : "You've answered every question. Once submitted, you can't change your answers."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Keep reviewing</AlertDialogCancel>
                                <AlertDialogAction
                                    className="rounded-xl bg-brand-primary hover:bg-brand-primary/90"
                                    onClick={handleSubmit}
                                >
                                    Submit
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Previous / Next */}
            <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => goTo(currentIndex - 1)}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => goTo(currentIndex + 1)}
                    disabled={currentIndex === totalQuestions - 1}
                >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}