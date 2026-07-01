import { CalendarDays, GraduationCap, Hash } from 'lucide-react';
import type { Classroom } from '@/lib/types/classrooms';

export default function ClassroomHeader({ classroom }: { classroom: Classroom }) {
    return (
        <div className="border-b border-white/[0.06] bg-white/[0.02]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-primary bg-brand-primary/10 px-3 py-1">
                    <GraduationCap className="h-3.5 w-3.5 text-brand-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-primary">
                        {classroom.semester ?? 'Current term'}
                    </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {classroom.name}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/40">
                    {classroom.code && (
                        <span className="inline-flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5" />
                            {classroom.code}
                        </span>
                    )}

                    {classroom.semester && (
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {classroom.semester}
                        </span>
                    )}

                    <span className="inline-flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/20 text-[10px] font-semibold text-brand-primary">
                            {(classroom.instructor?.name ?? 'TBD').charAt(0)}
                        </span>
                        {classroom.instructor?.name ?? 'Instructor to be announced'}
                    </span>
                </div>
            </div>
        </div>
    );
}