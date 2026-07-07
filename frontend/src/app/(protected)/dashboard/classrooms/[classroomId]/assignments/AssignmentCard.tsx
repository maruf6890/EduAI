"use client";

import {
  FileText,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Clock,
  Paperclip,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Assignment } from "./types";
import { formatDueDate, isOverdue } from "./AssignmentHelpers";

interface Props {
  assignment: Assignment;
  isTeacher: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AssignmentCard({ assignment, isTeacher, onView, onEdit, onDelete }: Props) {
  const overdue = isOverdue(assignment.due_date) && assignment.is_published;

  return (
    <div
      onClick={onView}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[#8168f3]/40 hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
    >
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8168f3]/10">
        <FileText className="h-5 w-5 text-[#8168f3]" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
            {assignment.title}
          </h3>
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
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{assignment.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className={`inline-flex items-center gap-1 ${overdue ? "text-red-500" : ""}`}>
            <Calendar className="h-3.5 w-3.5" />
            {formatDueDate(assignment.due_date)}
          </span>

          {assignment.total_marks !== null && assignment.total_marks > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {assignment.total_marks} points
            </span>
          )}

          {assignment.files.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {assignment.files.length} {assignment.files.length === 1 ? "file" : "files"}
            </span>
          )}

          {assignment.allow_late_submission && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Late submissions allowed
            </span>
          )}
        </div>
      </div>

      {/* Actions — teacher only */}
      {isTeacher && (
        <div className="shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500">
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}