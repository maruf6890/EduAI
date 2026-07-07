"use client";

import { Calendar, Clock, CheckCircle2, MoreVertical, Eye, Pencil, Trash2, Play, Square, ListChecks, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Quiz, QuizListItem } from "./types";
import { formatDateTime, formatDuration, getQuizStatusBadge } from "./QuizHelpers";

interface Props {
  quiz: Quiz | QuizListItem;
  isTeacher: boolean;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  onManageQuestions?: () => void;
  onViewResults?: () => void;
}

export default function QuizCard({
  quiz,
  isTeacher,
  onView,
  onEdit,
  onDelete,
  onStart,
  onEnd,
  onManageQuestions,
  onViewResults,
}: Props) {
  const badge = getQuizStatusBadge(quiz.status);

  return (
    <div
      onClick={onView}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[#8168f3]/40 hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8168f3]/10">
        <ListChecks className="h-5 w-5 text-[#8168f3]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">{quiz.title}</h3>
          <Badge variant="secondary" className={badge.className}>
            {badge.label}
          </Badge>
        </div>

        {quiz.description && (
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{quiz.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(quiz.scheduled_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(quiz.duration_minutes)}
          </span>
          {quiz.total_marks > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {quiz.total_marks} points
            </span>
          )}
        </div>
      </div>

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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4" />
                View
              </DropdownMenuItem>

              {quiz.status === "DRAFT" && (
                <>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onManageQuestions}>
                    <ListChecks className="h-4 w-4" />
                    Manage questions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onStart}>
                    <Play className="h-4 w-4" />
                    Start quiz
                  </DropdownMenuItem>
                </>
              )}

              {quiz.status === "ACTIVE" && (
                <DropdownMenuItem onClick={onEnd}>
                  <Square className="h-4 w-4" />
                  End quiz
                </DropdownMenuItem>
              )}

              {(quiz.status === "ACTIVE" || quiz.status === "ENDED") && (
                <DropdownMenuItem onClick={onViewResults}>
                  <BarChart3 className="h-4 w-4" />
                  View results
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
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