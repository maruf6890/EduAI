import {
    Trophy,
    Percent,
    Clock,
    CheckCircle2,
    XCircle,
    CircleDashed,
    ListChecks,
    AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyResult, type Answer, type QuizSubmissionResult } from "@/actions/dashboard/get_my_result";

/* =========================================================================
   HELPERS  (unchanged)
   ========================================================================= */

function formatDateTime(iso: string | null): string {
    if (!iso) return "Not submitted";
    const date = new Date(iso);
    return (
        date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }) + `, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    );
}

function getTotalMarks(answers: Answer[]): number {
    return answers.reduce((sum, a) => sum + (a.marks || 0), 0);
}

function statusStyles(status: QuizSubmissionResult["status"]): {
    label: string;
    className: string;
    icon: typeof CircleDashed;
} {
    switch (status) {
        case "SUBMITTED":
            return { label: "Submitted", className: "bg-brand-primary/10 text-brand-primary", icon: CheckCircle2 };
        case "IN_PROGRESS":
            return { label: "In progress", className: "bg-brand-secondary/10 text-brand-secondary", icon: Clock };
        case "EXPIRED":
            return { label: "Expired", className: "bg-zinc-800 text-zinc-400", icon: CircleDashed };
        default:
            return { label: status, className: "bg-zinc-800 text-zinc-400", icon: CircleDashed };
    }
}

/* =========================================================================
   PAGE (Server Component)
   ========================================================================= */

export default async function SubmissionDetailPage({
    params,
}: {
    params: Promise<{ classroomId: string; quizId: string }>;
}) {
    const { classroomId, quizId } = await params;

    let result: QuizSubmissionResult | null = null;
    let errorMessage: string | null = null;

    try {
        const res = await getMyResult(classroomId, quizId);
        result = res.data;
    } catch (err) {
        errorMessage = err instanceof Error ? err.message : "Failed to load result.";
    }

    if (errorMessage || !result) {
        return (
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <Card className="flex flex-col items-center gap-3 border-zinc-800 bg-zinc-900 py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <h2 className="text-sm font-medium text-zinc-200">Couldn't load this result</h2>
                    <p className="max-w-sm text-sm text-zinc-500">
                        {errorMessage ?? "Something went wrong while fetching this submission."}
                    </p>
                </Card>
            </div>
        );
    }

    const totalMarks = getTotalMarks(result.answers);
    const percentage = totalMarks > 0 ? Math.round((result.marks_obtained / totalMarks) * 100) : 0;
    const status = statusStyles(result.status);
    const StatusIcon = status.icon;

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                    <ListChecks className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100">Submission Result</h1>
                    <p className="text-sm text-zinc-500">Submission #{result.id}</p>
                </div>
            </div>

            {/* Summary card */}
            <Card className="border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`gap-1 border-0 ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <SummaryStat
                        icon={Trophy}
                        label="Marks obtained"
                        value={`${result.marks_obtained} / ${totalMarks}`}
                    />
                    <SummaryStat icon={Percent} label="Percentage" value={`${percentage}%`} />
                    <SummaryStat
                        icon={ListChecks}
                        label="Questions"
                        value={`${result.answers.length}`}
                    />
                    <SummaryStat
                        icon={Clock}
                        label="Submitted"
                        value={formatDateTime(result.submitted_at)}
                        small
                    />
                </div>
            </Card>

            {/* Question summary */}
            <div className="mt-6">
                <h2 className="mb-3 text-sm font-medium text-zinc-300">Question Summary</h2>

                <div className="flex flex-col gap-3">
                    {result.answers.map((answer, index) => (
                        <AnswerCard key={answer.question_id} index={index} answer={answer} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   SUMMARY STAT
   ========================================================================= */

function SummaryStat({
    icon: Icon,
    label,
    value,
    small,
}: {
    icon: typeof Trophy;
    label: string;
    value: string;
    small?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </span>
            <span className={`font-semibold text-zinc-100 ${small ? "text-sm" : "text-lg"}`}>
                {value}
            </span>
        </div>
    );
}

/* =========================================================================
   ANSWER CARD
   ========================================================================= */

function AnswerCard({ index, answer }: { index: number; answer: Answer }) {
    const isCorrect = answer.is_correct;

    return (
        <Card
            className={`flex flex-col gap-3 p-4 sm:p-5 ${isCorrect
                ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                : "border-red-500/20 bg-red-500/[0.04]"
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs font-medium text-zinc-500">Q{index + 1}</span>
                    <p className="text-sm font-medium text-zinc-100 sm:text-base">{answer.question_text}</p>
                </div>

                {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 sm:text-sm">
                <span>
                    Selected:{" "}
                    <span className={isCorrect ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                        {answer.selected_option}
                    </span>
                </span>

                {!isCorrect && (
                    <span>
                        Correct answer:{" "}
                        <span className="font-medium text-emerald-400">{answer.correct_option}</span>
                    </span>
                )}

                <span className="ml-auto text-zinc-500">
                    {answer.marks} {answer.marks === 1 ? "point" : "points"}
                </span>
            </div>
        </Card>
    );
}