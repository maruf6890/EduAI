"use client";

import { Users, GraduationCap, User, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommunityClassroom } from "./types";

interface Props {
  classroom: CommunityClassroom;
  onOpen: () => void;
  onJoinAsTeacher: () => void;
  onJoinAsStudent: () => void;
  isJoiningTeacher: boolean;
  isJoiningStudent: boolean;
}

export default function CommunityClassroomCard({
  classroom,
  onOpen,
  onJoinAsTeacher,
  onJoinAsStudent,
  isJoiningTeacher,
  isJoiningStudent,
}: Props) {
  const hasRole = classroom.role !== null;

  return (
    <Card
      onClick={hasRole ? onOpen : undefined}
      className={`group relative overflow-hidden border-border/60 p-0 transition-all duration-200 ${
        hasRole
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[#8168f3]/50 hover:shadow-lg hover:shadow-[#8168f3]/5"
          : "hover:border-border"
      }`}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#8168f3] to-[#a78bfa]" />

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8168f3] to-[#6f57e0] shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Users className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">
                {classroom.course_title}
              </h3>
              {classroom.description ? (
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {classroom.description}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground/60">Community study group</p>
              )}
            </div>
          </div>

          {classroom.role === "teacher" && (
            <Badge className="shrink-0 gap-1 border-0 bg-[#8168f3]/10 text-[#8168f3] hover:bg-[#8168f3]/10">
              <GraduationCap className="h-3 w-3" />
              Teaching
            </Badge>
          )}
          {classroom.role === "student" && (
            <Badge className="shrink-0 gap-1 border-0 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400">
              <User className="h-3 w-3" />
              Enrolled
            </Badge>
          )}
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              classroom.has_teacher
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                classroom.has_teacher ? "bg-green-500" : "bg-amber-500"
              }`}
            />
            {classroom.has_teacher ? "Has a teacher" : "Needs a teacher"}
          </span>
          {!classroom.has_teacher && !hasRole && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Be the first to teach
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
          {hasRole ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpen}
              className="w-full justify-center gap-1.5 border-[#8168f3]/30 text-[#8168f3] hover:bg-[#8168f3]/5 hover:text-[#8168f3] sm:w-auto"
            >
              Open classroom
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              {!classroom.has_teacher && (
                <Button
                  size="sm"
                  onClick={onJoinAsTeacher}
                  disabled={isJoiningTeacher}
                  className="flex-1 gap-1.5 bg-[#8168f3] text-white hover:bg-[#6f57e0] sm:flex-none"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  {isJoiningTeacher ? "Joining..." : "Join as teacher"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onJoinAsStudent}
                disabled={isJoiningStudent}
                className="flex-1 gap-1.5 sm:flex-none"
              >
                <User className="h-3.5 w-3.5" />
                {isJoiningStudent ? "Joining..." : "Join as student"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
