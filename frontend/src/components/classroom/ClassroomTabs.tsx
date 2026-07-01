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
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function ClassroomTabs({ classroomId }: { classroomId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    // const [activeTab, setActiveTab] = useState<TabKey>('announcements');

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] py-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => router.push(`/dashboard/classrooms/${classroomId}/${tab.key}`)}
                        className={cn(
                            'shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors',
                            tab.key === "announcements"
                                ? pathname === `/dashboard/classrooms/${classroomId}`
                                : pathname === `/dashboard/classrooms/${classroomId}/${tab.key}`
                                    ? 'bg-brand-primary/8 text-brand-primary'
                                    : 'text-white/40 hover:bg-brand-primary/4 hover:text-brand-primary/70',
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="py-10">
                {pathname === `/dashboard/classrooms/${classroomId}` && <PlaceholderPanel label="Announcements" />}
                {pathname === `/dashboard/classrooms/${classroomId}/materials` && <PlaceholderPanel label="Materials" />}
                {pathname === `/dashboard/classrooms/${classroomId}/assignments` && <PlaceholderPanel label="Assignments" />}
                {pathname === `/dashboard/classrooms/${classroomId}/quizzes` && <PlaceholderPanel label="Quizzes" />}
                {pathname === `/dashboard/classrooms/${classroomId}/people` && <PlaceholderPanel label="People" />}
            </div>
        </div>
    );
}

/**
 * Placeholder content for each tab. Replace each branch above with a real
 * panel component (e.g. <AnnouncementsList classroomId={classroomId} />)
 * once GET /classrooms/:classroomId/announcements etc. exist.
 */
function PlaceholderPanel({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-20 text-center">
            <p className="text-sm font-medium text-white/40">No {label.toLowerCase()} yet</p>
            <p className="mt-1 text-xs text-white/20">This panel is ready to be wired up to real data.</p>
        </div>
    );
}