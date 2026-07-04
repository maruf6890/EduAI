import Link from "next/link";
import { getMyResult } from "@/actions/dashboard/quiz_attempt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";

interface PageProps {
    params: Promise<{ classroomId: string; quizId: string }>;
}

function formatDateTime(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

const STATUS_LABEL: Record<string, string> = {
    SUBMITTED: "Submitted",
    TIMED_OUT: "Timed out",
    IN_PROGRESS: "In progress",
};

export default async function QuizResultPage({ params }: PageProps) {
    const { classroomId, quizId } = await params;
    const res = await getMyResult(classroomId, quizId);

    const quizzesHref = `/dashboard/classrooms/${classroomId}/quizzes`;

    if (!res.success || !res.data) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold">No result to show yet</h2>
                <p className="text-sm text-muted-foreground">
                    {res.message || "We couldn't find a result for this quiz."}
                </p>
                <Button asChild variant="outline" className="rounded-xl">
                    <Link href={quizzesHref}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to quizzes
                    </Link>
                </Button>
            </div>
        );
    }

    const result = res.data;

    // The backend doesn't return `total_marks` on the result payload, so it's
    // derived from the per-question breakdown it does return.
    const totalMarks = result.answers.reduce((sum, a) => sum + a.marks, 0);
    const percentage = totalMarks > 0 ? Math.round((result.marks_obtained / totalMarks) * 1000) / 10 : 0;
    const correctCount = result.answers.filter((a) => a.is_correct).length;

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
            <Link
                href={quizzesHref}
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to quizzes
            </Link>

            <h1 className="mb-6 text-xl font-semibold text-brand-primary md:text-2xl">Quiz result</h1>

            <Card className="mb-6 rounded-xl">
                <CardContent className="grid grid-cols-2 gap-6 pt-6 md:grid-cols-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                            <Trophy className="h-5 w-5 text-brand-primary" />
                        </div>
                        <p className="text-lg font-semibold">
                            {result.marks_obtained}
                            {totalMarks > 0 && <span className="text-muted-foreground"> / {totalMarks}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">Marks obtained</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-secondary/10">
                            <CheckCircle2 className="h-5 w-5 text-brand-secondary" />
                        </div>
                        <p className="text-lg font-semibold">{percentage}%</p>
                        <p className="text-xs text-muted-foreground">Percentage</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-semibold">
                            {correctCount}
                            <span className="text-muted-foreground"> / {result.answers.length}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Correct answers</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Badge variant="secondary" className="rounded-lg">
                            {STATUS_LABEL[result.status] ?? result.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{formatDateTime(result.submitted_at)}</p>
                    </div>
                </CardContent>
            </Card>

            {result.answers.length > 0 && (
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-base">Question summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {result.answers.map((answer, idx) => (
                            <div
                                key={answer.question_id}
                                className={`rounded-xl border px-4 py-3 ${answer.is_correct ? "border-brand-secondary/30 bg-brand-secondary/5" : "border-red-200 bg-red-50/60"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-medium">
                                        {idx + 1}. {answer.question_text}
                                    </p>
                                    {answer.is_correct ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-secondary" />
                                    ) : (
                                        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                                    )}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span>
                                        Your answer: <span className="font-medium text-foreground">{answer.selected_option || "—"}</span>
                                    </span>
                                    {!answer.is_correct && (
                                        <span>
                                            Correct answer: <span className="font-medium text-foreground">{answer.correct_option}</span>
                                        </span>
                                    )}
                                    <span>{answer.marks} {answer.marks === 1 ? "mark" : "marks"}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}