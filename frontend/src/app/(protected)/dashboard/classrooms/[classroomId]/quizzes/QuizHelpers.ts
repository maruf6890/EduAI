import { QuizStatus, QuizSubmissionStatus } from "./types";

export function formatDateTime(value: string | null): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return (
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getQuizStatusBadge(status: QuizStatus): { label: string; className: string } {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Live now",
        className: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      };
    case "ENDED":
      return {
        label: "Ended",
        className: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
      };
    case "SCHEDULED":
      return { label: "Scheduled", className: "bg-[#8168f3]/10 text-[#8168f3]" };
    case "DRAFT":
    default:
      return {
        label: "Draft",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
      };
  }
}

export function getSubmissionStatusBadge(status: QuizSubmissionStatus): { label: string; className: string } {
  switch (status) {
    case "SUBMITTED":
      return { label: "Submitted", className: "bg-[#8168f3]/10 text-[#8168f3]" };
    case "TIMED_OUT":
      return {
        label: "Timed out",
        className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      };
    case "IN_PROGRESS":
    default:
      return {
        label: "In progress",
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
      };
  }
}