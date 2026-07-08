'use client';

import { cn } from '@/lib/utils';
import type { ClassroomCard } from '@/lib/types/classrooms';
import { GraduationCap, ArrowRight, BookOpen, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { hover } from 'framer-motion';
export type { ClassroomCard } from '@/lib/types/classrooms';

export interface CardFlipProps {
  classroom: ClassroomCard;
}

export default function CardFlip({ classroom }: CardFlipProps) {
  const router = useRouter();

  const showCourseTitle =
    classroom.courseTitle && classroom.courseTitle !== classroom.name;
  const isTeacher = classroom.role === 'teacher';

  return (
    <div
      onClick={() => router.push(`/dashboard/classrooms/${classroom.id}`)}
      className={cn(
        'group relative flex h-full cursor-pointer flex-col gap-4 overflow-hidden',
        'rounded-xl border-2 border-border-main bg-main p-5',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/5',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/80 to-brand-primary shadow-sm transition-transform duration-200 group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-snug text-text-main">
              {classroom.name}
            </h3>
            {showCourseTitle && (
              <p className="mt-0.5 truncate text-[12px] text-text-main/60">
                {classroom.courseTitle}
              </p>
            )}
          </div>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest',
            isTeacher
              ? 'shrink-0 gap-1 border-0 bg-[#8168f3]/10 text-[#8168f3] hover:bg-[#8168f3]/10'
              : 'shrink-0 gap-1 border-0 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400',
          )}
        >
          {isTeacher ? (<span className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            Teaching
          </span>) : (<span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Enrolled
          </span>)}
        </span>
      </div>

      {/* Description */}
      {classroom.description ? (
        <p className="line-clamp-2 text-[12px] leading-relaxed text-text-main/60">
          {classroom.description}
        </p>
      ) : (
        <p className="text-[12px] text-text-main/30">No description added</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5  py-1 font-mono text-[11px] font-medium text-text-main/70">
          <BookOpen className="h-3 w-3" />
          {classroom.courseCode}
        </span>
        {/* {classroom.semester && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-text-main/70">
            Semester {classroom.semester}
          </span>
        )} */}
      </div>

      {/* Instructor */}
      <div className="flex items-center">
        <div className="flex h-5 w-5 shrink-0 items-center  rounded-full bg-white/10">
          <GraduationCap className="h-3 w-3 text-text-main/50" />
        </div>
        <span className="truncate text-[12px] text-text-main/50">
          {classroom.instructor}
        </span>
      </div>

      {/* Spacer keeps the button flush to the bottom so every card in a row lines up */}
      <div className="flex-1" />

      {/* Action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/dashboard/classrooms/${classroom.id}`);
        }}
        className={cn(
          'flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-primary/30 px-4 py-2.5',
          'text-[13px] font-semibold text-brand-primary transition-all duration-200',
          'hover:bg-brand-primary/5 active:scale-[0.98]',
        )}
      >
        Open classroom
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}