
'use client';


import { cn } from '@/lib/utils';
import type { ClassroomCard } from '@/lib/types/classrooms';
import {
  GraduationCap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export type { ClassroomCard } from '@/lib/types/classrooms';

export interface CardFlipProps {
  classroom: ClassroomCard;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardFlip({ classroom }: CardFlipProps) {
  const [flipped, setFlipped] = useState(false);
  const router = useRouter();

  const gradient = 'from-brand-primary/50 to-brand-primary';
  const showCourseTitle =
    classroom.courseTitle && classroom.courseTitle !== classroom.name;

  return (
    <div
      className="group  relative h-[250px] w-full [perspective:1800px]"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      {/* ── Flip container ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative h-full w-full [transform-style:preserve-3d]',
          // 'transition-transform duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)]',
          flipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]',
        )}
      >

        {/* ════════════════════════════════════════════════════════════════════
            FRONT
        ════════════════════════════════════════════════════════════════════ */}
        {/* <div
          className={cn(
            'absolute inset-0 [backface-visibility:hidden] rounded-sm overflow-hidden',
            'bg-black border border-border-main',
            'transition-shadow duration-500 group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.7)]',
            flipped ? 'pointer-events-none' : 'pointer-events-auto',
          )}
        > */}

        <div
          className={cn(
            'absolute inset-0 [backface-visibility:hidden] rounded-sm overflow-hidden',
            'bg-main border-2 border-border-main', // Changed: bg-main and lighter border
            'transition-shadow duration-500 group-hover:shadow-[0_8px_40px_rgba(139,92,246,0.1)]', // Softer shadow
            flipped ? 'pointer-events-none' : 'pointer-events-auto',
          )}
        >
          {/* Cover strip */}
          <div className={cn('relative h-[130px] w-full bg-gradient-to-br', gradient)}>
            {classroom.coverImage && (
              <img
                src={classroom.coverImage}
                alt={classroom.name}
                className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-60"
              />
            )}
            {/* Noise texture */}
            <div
              className="absolute inset-0 opacity-20 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
              }}
            />
            {/* Fade into card body */}
            {/* <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-main to-transparent" /> */}
            {/* Role badge — dynamic per-card, since the dashboard now mixes
                taught and enrolled classes in one grid. */}
            <span
              className={cn(
                'absolute top-3 right-3 rounded-full border px-2.5 py-1',
                'text-[10px] font-semibold uppercase tracking-widest',
                classroom.role === 'teacher'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/25'
                  : 'bg-white/10 text-text-main border-white/10',
              )}
            >
              {classroom.role === 'teacher' ? 'Teaching' : 'Enrolled'}
            </span>

            {/* Semester label */}
            {classroom.semester && (
              <span className="absolute bottom-4 left-4 text-[11px] font-medium text-text-main/60">
                Semester: {classroom.semester}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 px-5 pb-4 pt-3">
            {/* Title */}
            <div>
              <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-text-main">
                {classroom.name}
              </h3>
              {showCourseTitle && (
                <p className="mt-0.5 truncate text-[12px] font-semibold text-text-main capitalize">
                  Course Title: {classroom.courseTitle}
                </p>
              )}
              <p className="mt-0.5 font-mono text-[12px] font-semibold text-text-main">
                Course Code: {classroom.courseCode}
              </p>
            </div>

            {/* Creator — full name of the user who created the classroom */}
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                <GraduationCap className="h-3 w-3 text-text-main/50" />
              </div>
              <span className="truncate text-[12px] text-text-main/50">
                {classroom.instructor}
              </span>
            </div>

            {/* Stats — materials & quizzes only
            <div className="mt-1 grid grid-cols-2 gap-2">
              {[
                { icon: <BookOpen className="h-3.5 w-3.5" />, value: classroom.stats.materials, label: 'Materials' },
                { icon: <CalendarDays className="h-3.5 w-3.5" />, value: classroom.stats.quizzes, label: 'Quizzes' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.05] bg-white/[0.04] px-1 py-2"
                >
                  <span className="text-text-main/30">{s.icon}</span>
                  <span className="tabular-nums text-[13px] font-semibold text-text-main">
                    {s.value}
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-wide text-text-main/25">
                    {s.label}
                  </span>
                </div>
              ))}
            </div> */}


          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            BACK
        ════════════════════════════════════════════════════════════════════ */}
        {/* <div
          className={cn(
            'absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]',
            'flex flex-col overflow-hidden rounded-sm',
            'bg-[#161820] border border-white/[0.06]',
            'shadow-[0_4px_24px_rgba(0,0,0,0.5)]',
            'transition-shadow duration-500 group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.7)]',
            !flipped ? 'pointer-events-none' : 'pointer-events-auto',
          )}
        > */}
        <div
          className={cn(
            'absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]',
            'flex flex-col overflow-hidden rounded-sm',
            'bg-bg-main border-2 border-border-main', // Changed: white background
            'shadow-[0_4px_24px_rgba(0,0,0,0.05)]', // Lighter shadow
            !flipped ? 'pointer-events-none' : 'pointer-events-auto',
          )}
        >
          {/* Top accent line (matches front cover gradient) */}
          <div className={cn('h-1 w-full shrink-0 bg-gradient-to-r', gradient)} />

          <div className="flex flex-1 flex-col gap-3 overflow-hidden px-5 py-4">

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold leading-snug text-text-main">
                  {classroom.name}
                </h3>
                <p className="mt-0.5 font-mono text-[11px] text-text-main">
                  {classroom.courseCode}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-text-main">
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="max-w-[90px] truncate">{classroom.instructor}</span>
              </div>
            </div>

            {/* Description — only the DB schema's `description` column, when present */}
            {classroom.description && (
              <p
                className="line-clamp-2 text-[11px] leading-relaxed text-text-main transition-all duration-500"
                style={{
                  opacity: flipped ? 1 : 0,
                  transitionDelay: '100ms',
                }}
              >
                {classroom.description}
              </p>
            )}

            {/* Open Classroom button */}
            <button
              onClick={() => router.push(`/dashboard/classrooms/${classroom.id}`)}
              className={cn(
                'mt-auto w-full rounded-xl py-2.5 px-4',
                'flex items-center justify-center gap-2',
                'bg-gradient-to-r text-text-main',
                gradient,
                'text-[13px] font-semibold tracking-tight',
                'shadow-lg shadow-black/30',
                'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]',
                'transition-all duration-200',
              )}
              style={{
                opacity: flipped ? 1 : 0,
                transform: flipped ? 'translateY(0)' : 'translateY(6px)',
                transitionDelay: '480ms',
              }}
            >
              Open Classroom
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

