// 'use client';

// /**
//  * @description: Classroom Management Page
//  * @version: 2.0.0
//  */

// import { BookOpen, CalendarDays, ClipboardList, GraduationCap, Plus, Users } from 'lucide-react';
// import CardFlip, { ClassroomCard } from '@/components/mvpblocks/Cardflip';
// import { cn } from '@/lib/utils';
// import { dummyClassrooms } from '@/lib/dummy/classroom';

// // ─── Dummy data (replace with your real fetch) ────────────────────────────────



// // ─── Page Props ───────────────────────────────────────────────────────────────

// interface ClassroomPageProps {
//     /** Pass real data from your backend; falls back to dummy data when undefined */
//     data?: ClassroomCard[];
//     /** Controls visibility of the "Create Classroom" button */
//     role?: 'teacher' | 'student';
// }

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function ClassroomPage({ data, role = 'teacher' }: ClassroomPageProps) {
//     const classrooms = data ?? dummyClassrooms;

//     return (
//         <div className="min-h-screen bg-[#0C0D10] text-white">

//             {/* Subtle dot-grid background */}
//             <div
//                 className="pointer-events-none fixed inset-0 opacity-[0.025]"
//                 style={{
//                     backgroundImage:
//                         'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
//                     backgroundSize: '48px 48px',
//                 }}
//             />

//             <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

//                 {/* ── Page Header ─────────────────────────────────────────────────── */}
//                 <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
//                     <div>
//                         {/* Eyebrow pill */}
//                         <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1">
//                             <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
//                             <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
//                                 {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
//                             </span>
//                         </div>

//                         <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
//                             My Classrooms
//                         </h1>
//                         <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-white/40">
//                             Access, manage and monitor all your active classrooms.
//                         </p>
//                     </div>

//                     {/* Create Classroom — teachers only */}
//                     {role === 'teacher' && (
//                         <button
//                             className={cn(
//                                 'flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5',
//                                 'bg-brand-primary text-[13px] font-semibold text-white shadow-lg shadow-indigo-950/50',
//                                 'transition-all duration-200 hover:bg-brand-secondary hover:scale-[1.02] active:scale-[0.98]',
//                             )}
//                         >
//                             <Plus className="h-4 w-4" />
//                             Create Classroom
//                         </button>
//                     )}
//                 </div>

//                 {/* ── Summary Stats Bar ────────────────────────────────────────────── */}
//                 <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
//                     {[
//                         { icon: <BookOpen className="h-4 w-4" />, label: 'Total Courses', value: classrooms.length },
//                         { icon: <Users className="h-4 w-4" />, label: 'Total Students', value: classrooms.reduce((a, c) => a + c.stats.students, 0) },
//                         { icon: <ClipboardList className="h-4 w-4" />, label: 'Assignments', value: classrooms.reduce((a, c) => a + c.stats.assignments, 0) },
//                         { icon: <CalendarDays className="h-4 w-4" />, label: 'Quizzes', value: classrooms.reduce((a, c) => a + c.stats.quizzes, 0) },
//                     ].map((s) => (
//                         <div
//                             key={s.label}
//                             className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
//                         >
//                             <span className="text-white/30">{s.icon}</span>
//                             <div>
//                                 <p className="tabular-nums text-xl font-bold text-white">{s.value}</p>
//                                 <p className="text-[11px] text-white/30">{s.label}</p>
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 {/* ── Classroom Grid ───────────────────────────────────────────────── */}
//                 {classrooms.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center py-32 text-center">
//                         <GraduationCap className="mb-4 h-12 w-12 text-white/10" />
//                         <h2 className="text-lg font-semibold text-white/40">No classrooms yet</h2>
//                         <p className="mt-1 text-sm text-white/20">
//                             {role === 'teacher'
//                                 ? 'Create your first classroom to get started.'
//                                 : 'You have not been enrolled in any classrooms.'}
//                         </p>
//                     </div>
//                 ) : (
//                     <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//                         {classrooms.map((classroom) => (
//                             <CardFlip key={classroom.id} classroom={classroom} />
//                         ))}
//                     </div>
//                 )}

//             </div>
//         </div>
//     );
// }
'use client';

/**
 * @description: Classroom Management Page
 * @version: 2.1.0
 */

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { BookOpen, CalendarDays, ClipboardList, GraduationCap, Plus, Users } from 'lucide-react';
import CardFlip, { ClassroomCard } from '@/components/mvpblocks/Cardflip';
import CreateClassroom from '@/components/classroom/CreateClassModal';
import { cn } from '@/lib/utils';
import { dummyClassrooms } from '@/lib/dummy/classroom';
import type { Classroom } from '@/lib/types/classroom';
import { private_api_call } from "@/actions/private_api_call";

// ─── Dummy data (replace with your real fetch) ────────────────────────────────



// ─── Page Props ───────────────────────────────────────────────────────────────

interface ClassroomPageProps {
    /** Pass real data from your backend; falls back to dummy data when undefined */
    data?: ClassroomCard[];
    /** Controls visibility of the "Create Classroom" button */
    role?: 'teacher' | 'student';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassroomPage({ data, role = 'teacher' }: ClassroomPageProps) {
    const classrooms = data ?? dummyClassrooms;
    const router = useRouter();

    // Controls the Create Classroom modal/dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    /**
     * Called by <CreateClassroom /> once the backend confirms the classroom
     * was created. Closes the modal and routes straight to the new
     * classroom's detail page.
     *
     * ASSUMPTION: this file assumes `CreateClassroom` is a dialog component
     * with the props `open`, `onOpenChange`, and `onSuccess(classroom)`.
     * If your existing component uses different prop names (e.g. `isOpen` /
     * `onClose` / `onCreated`), update the JSX below to match — the rest of
     * the flow (closing + redirect) stays the same.
     */
    const handleClassroomCreated = (classroom: Classroom) => {
        setIsCreateOpen(false);

        // if (classroom.id) {
        //     router.push(`/dashboard/classrooms/${classroom.id}`);
        // } else {
        router.push(`/dashboard/classrooms/0`);
        // }
    };

    return (
        <div className="min-h-screen bg-[#0C0D10] text-white">

            {/* Subtle dot-grid background */}
            <div
                className="pointer-events-none fixed inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

                {/* ── Page Header ─────────────────────────────────────────────────── */}
                <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        {/* Eyebrow pill */}
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1">
                            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            My Classrooms
                        </h1>
                        <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-white/40">
                            Access, manage and monitor all your active classrooms.
                        </p>
                    </div>

                    {/* Create Classroom — teachers only */}
                    {role === 'teacher' && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className={cn(
                                'flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5',
                                'bg-brand-primary text-[13px] font-semibold text-white shadow-lg shadow-indigo-950/50',
                                'transition-all duration-200 hover:bg-brand-secondary hover:scale-[1.02] active:scale-[0.98]',
                            )}
                        >
                            <Plus className="h-4 w-4" />
                            Create Classroom
                        </button>
                    )}
                </div>

                {/* ── Summary Stats Bar ────────────────────────────────────────────── */}
                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { icon: <BookOpen className="h-4 w-4" />, label: 'Total Courses', value: classrooms.length },
                        { icon: <Users className="h-4 w-4" />, label: 'Total Students', value: classrooms.reduce((a, c) => a + c.stats.students, 0) },
                        { icon: <ClipboardList className="h-4 w-4" />, label: 'Assignments', value: classrooms.reduce((a, c) => a + c.stats.assignments, 0) },
                        { icon: <CalendarDays className="h-4 w-4" />, label: 'Quizzes', value: classrooms.reduce((a, c) => a + c.stats.quizzes, 0) },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                        >
                            <span className="text-white/30">{s.icon}</span>
                            <div>
                                <p className="tabular-nums text-xl font-bold text-white">{s.value}</p>
                                <p className="text-[11px] text-white/30">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Classroom Grid ───────────────────────────────────────────────── */}
                {classrooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <GraduationCap className="mb-4 h-12 w-12 text-white/10" />
                        <h2 className="text-lg font-semibold text-white/40">No classrooms yet</h2>
                        <p className="mt-1 text-sm text-white/20">
                            {role === 'teacher'
                                ? 'Create your first classroom to get started.'
                                : 'You have not been enrolled in any classrooms.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {classrooms.map((classroom) => (
                            <CardFlip key={classroom.id} classroom={classroom} />
                        ))}
                    </div>
                )}

            </div>

            {/* ── Create Classroom modal ───────────────────────────────────────── */}
            <CreateClassroom
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={handleClassroomCreated}
            />
        </div>
    );
}