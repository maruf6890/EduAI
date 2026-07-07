// export function formatDueDate(due_date: string | null): string {
//   if (!due_date) return "No due date";
//   const date = new Date(due_date);
//   const now = new Date();
//   const isOverdue = date.getTime() < now.getTime();
//   const formatted = date.toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//     ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
//   });
//   const time = date.toLocaleTimeString("en-US", {
//     hour: "numeric",
//     minute: "2-digit",
//   });
//   return `${isOverdue ? "Was due" : "Due"} ${formatted}, ${time}`;
// }

// export function isOverdue(due_date: string | null): boolean {
//   if (!due_date) return false;
//   return new Date(due_date).getTime() < Date.now();
// }

import { SubmissionStatus } from "./types";

export function formatDueDate(due_date: string | null): string {
  if (!due_date) return "No due date";
  const date = new Date(due_date);
  const now = new Date();
  const isOverdue = date.getTime() < now.getTime();
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${isOverdue ? "Was due" : "Due"} ${formatted}, ${time}`;
}

export function isOverdue(due_date: string | null): boolean {
  if (!due_date) return false;
  return new Date(due_date).getTime() < Date.now();
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + ", " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStatusBadge(status: SubmissionStatus): { label: string; className: string } {
  switch (status) {
    case "GRADED":
      return {
        label: "Graded",
        className: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      };
    case "LATE":
      return {
        label: "Late",
        className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      };
    case "SUBMITTED":
      return {
        label: "Submitted",
        className: "bg-[#8168f3]/10 text-[#8168f3]",
      };
    case "DRAFT":
    default:
      return {
        label: "Draft",
        className: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
      };
  }
}