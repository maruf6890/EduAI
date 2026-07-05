'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

const TABS = [
    { key: 'announcements', label: 'Announcements' },
    { key: 'materials', label: 'Materials' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'people', label: 'People' },
    { key: 'discussion', label: 'Discussion' },
    { key: 'submissions', label: 'My Submissions' },
] as const;

type TabKey = (typeof TABS)[number]['key'];
export default function ClassroomTabs({ classroomId }: { classroomId: string }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] py-2">
                {TABS.map((tab) => {
                    // Build the target path for every tab consistently
                    const tabPath = `/dashboard/classrooms/${classroomId}/${tab.key}`;
                    const isActive = pathname === tabPath;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => {
                                if (tab.key === "announcements") {
                                    router.push(`/dashboard/classrooms/${classroomId}`);
                                } else {
                                    router.push(`/dashboard/classrooms/${classroomId}/${tab.key}`);
                                }
                            }}
                            className={cn(
                                'shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors',
                                isActive
                                    ? 'bg-brand-primary/10 text-brand-primary' // Changed to /10 for visibility
                                    : 'text-white/40 hover:bg-brand-primary/5 hover:text-brand-primary/70',
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* <div className="py-10">
                {/* Dynamically render based on the current tab */}
            {/* {pathname.includes('/announcements') && <PlaceholderPanel label="Announcements" />}
                {pathname.includes('/materials') && <PlaceholderPanel label="Materials" />}
                {pathname.includes('/assignments') && <PlaceholderPanel label="Assignments" />}
                {pathname.includes('/quizzes') && <PlaceholderPanel label="Quizzes" />}
                {pathname.includes('/people') && <PlaceholderPanel label="People" />}
                {pathname.includes('/discussion') && <PlaceholderPanel label="Discussion" />}
            </div> */}
        </div>
    );
}

/**
 * Placeholder content for each tab. Replace each branch above with a real
 * panel component (e.g. <AnnouncementsList classroomId={classroomId} />)
 * once GET /classrooms/:classroomId/announcements etc. exist.
 */
// function PlaceholderPanel({ label }: { label: string }) {
//     return (
//         <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-20 text-center">
//             <p className="text-sm font-medium text-white/40">No {label.toLowerCase()} yet</p>
//             <p className="mt-1 text-xs text-white/20">This panel is ready to be wired up to real data.</p>
//         </div>
//     );
// }