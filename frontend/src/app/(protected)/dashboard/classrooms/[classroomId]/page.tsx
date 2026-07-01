// /**
//  * @description: Classroom Detail Page
//  * @route: /dashboard/classrooms/[classroomId]/contains announcements and other options
//  */

// import { notFound } from 'next/navigation';
// import { public_api_call } from "@/actions/public_api_call";
// import ClassroomHeader from '@/components/classroom/ClassroomHeader';
// import ClassroomTabs from '@/components/classroom/ClassroomTabs';

// interface ClassroomDetailPageProps {
//     params: {
//         classroomId: string;
//     };
// }

// export default async function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
//     const { classroomId } = params;
//     // const classroom = await public_api_call(`/classrooms/${classroomId}`);


//     const classroom = {
//         id: classroomId,
//         name: `Classroom ${classroomId}`,
//         stats: {
//             students: 10,
//             assignments: 5,
//             quizzes: 3,
//             announcements: 2,
//             calendar: 1,
//         }
//     }
//     // if (!classroom) {
//     //     notFound();
//     // }

//     return (
//         <div className="min-h-screen bg-bg-main text-text-main">
//             <ClassroomHeader classroom={classroom} />
//             <ClassroomTabs classroomId={classroom.id} />


//         </div>
//     );
// }
"use client";

/**
 * @description: Classroom Detail Page
 * @route: /dashboard/classrooms/[classroomId]/contains announcements and other options
 */

import { useState } from "react";
import { notFound } from "next/navigation";
import { public_api_call } from "@/actions/public_api_call";
import ClassroomHeader from "@/components/classroom/ClassroomHeader";
import ClassroomTabs from "@/components/classroom/ClassroomTabs";
// NOTE: adjust this import path to wherever your AnnouncementModal actually lives.
import AnnouncementModal from "@/components/classroom/Announcementmodal";

import { MessageSquare } from "lucide-react";

interface ClassroomDetailPageProps {
    params: {
        classroomId: string;
    };
}

interface Comment {
    id: string;
    author: string;
    role?: "Instructor" | "Student";
    content: string;
    createdAt: string;
}

interface Announcement {
    id: string;
    author: string;
    role: "Instructor" | "Student";
    content: string;
    createdAt: string;
    comments: Comment[];
}

const dummyAnnouncements: Announcement[] = [
    {
        id: "1",
        author: "John Doe",
        role: "Instructor",
        content:
            "Welcome to the course! I'm excited to have all of you here this semester. Please take a moment to review the syllabus under Materials and introduce yourself in the comments below.",
        createdAt: "2 days ago",
        comments: [
            {
                id: "c1",
                author: "Aisha Khan",
                role: "Student",
                content: "Excited to get started! Thanks for the warm welcome.",
                createdAt: "1 day ago",
            },
            {
                id: "c2",
                author: "Marcus Lee",
                role: "Student",
                content: "Looking forward to this class, Professor Doe.",
                createdAt: "1 day ago",
            },
        ],
    },
    {
        id: "2",
        author: "John Doe",
        role: "Instructor",
        content:
            "Reminder: Assignment 1 is due this Friday at 11:59 PM. Late submissions will lose 10% per day. Reach out if you're stuck on Problem 3 — office hours are open all week.",
        createdAt: "1 day ago",
        comments: [
            {
                id: "c3",
                author: "Priya Nair",
                role: "Student",
                content: "Is the office hours schedule posted anywhere?",
                createdAt: "22 hours ago",
            },
        ],
    },
    {
        id: "3",
        author: "Sarah Chen",
        role: "Instructor",
        content:
            "Great work on the midterm quiz, everyone! Average score was 87%. I've posted detailed feedback for each question under Quizzes. Let's go over the trickier ones in class tomorrow.",
        createdAt: "3 days ago",
        comments: [],
    },
    {
        id: "4",
        author: "John Doe",
        role: "Instructor",
        content:
            "Class is moved to Room 214 for next week only due to a scheduling conflict in our usual room. Same time, 10:00 AM. Sorry for the short notice!",
        createdAt: "4 days ago",
        comments: [
            {
                id: "c4",
                author: "Diego Ramirez",
                role: "Student",
                content: "Thanks for the heads up, appreciate it.",
                createdAt: "4 days ago",
            },
        ],
    },
    {
        id: "5",
        author: "John Doe",
        role: "Instructor",
        content:
            "New reading material has been uploaded for Chapter 4. It's optional but strongly recommended if you found last week's lecture on recursion tricky.",
        createdAt: "6 days ago",
        comments: [],
    },
];

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
    const { classroomId } = params;

    // ============ BACKEND: GET classroom ============
    // const classroom = await public_api_call(`/classrooms/${classroomId}`);

    const classroom = {
        id: classroomId,
        name: `Classroom ${classroomId}`,
        stats: {
            students: 10,
            assignments: 5,
            quizzes: 3,
            announcements: 2,
            calendar: 1,
        },
    };

    // if (!classroom) {
    //   notFound();
    // }

    // TODO: derive from auth/session once backend is wired up.
    const isTeacher = true;

    const [announcements, setAnnouncements] = useState<Announcement[]>(dummyAnnouncements);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ============ BACKEND: GET announcements ============
    // useEffect(() => {
    //   const fetchAnnouncements = async () => {
    //     const res = await public_api_call(`/classrooms/${classroomId}/announcements`);
    //     setAnnouncements(res.data);
    //   };
    //   fetchAnnouncements();
    // }, [classroomId]);

    const handlePost = (content: string) => {
        if (!content.trim()) return;

        const newAnnouncement: Announcement = {
            id: crypto.randomUUID(),
            author: "You",
            role: "Instructor",
            content,
            createdAt: "Just now",
            comments: [],
        };

        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        setIsModalOpen(false);

        // ============ BACKEND: POST announcement ============
        // const res = await public_api_call(`/classrooms/${classroomId}/announcements`, {
        //   method: "POST",
        //   body: { content },
        // });
        // Once wired up, replace the optimistic entry above with res.data,
        // or re-fetch the feed to stay in sync.
    };

    // ============ BACKEND: DELETE announcement ============
    // const handleDeleteAnnouncement = async (announcementId: string) => {
    //   await public_api_call(`/classrooms/${classroomId}/announcements/${announcementId}`, {
    //     method: "DELETE",
    //   });
    //   setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    // };

    // ============ BACKEND: EDIT announcement ============
    // const handleEditAnnouncement = async (announcementId: string, content: string) => {
    //   await public_api_call(`/classrooms/${classroomId}/announcements/${announcementId}`, {
    //     method: "PATCH",
    //     body: { content },
    //   });
    //   setAnnouncements((prev) =>
    //     prev.map((a) => (a.id === announcementId ? { ...a, content } : a))
    //   );
    // };

    return (
        <div className="min-h-screen bg-bg-main text-text-main">
            <ClassroomHeader classroom={classroom} />
            <ClassroomTabs classroomId={classroom.id} />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
                {isTeacher && (
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-left shadow-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                            Y
                        </div>
                        <span className="text-sm text-zinc-400">Announce something to your class</span>
                    </button>
                )}

                {announcements.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center">
                        <p className="text-sm text-zinc-500">
                            No announcements yet. Post something to get the conversation started.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {announcements.map((announcement) => {
                            const isExpanded = expandedId === announcement.id;

                            return (
                                <div
                                    key={announcement.id}
                                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm"
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                                            {getInitials(announcement.author)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium text-zinc-100">
                                                    {announcement.author}
                                                </span>
                                                {announcement.role === "Instructor" && (
                                                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                                                        Instructor
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-zinc-500">{announcement.createdAt}</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                                        {announcement.content}
                                    </p>

                                    {/* Attachment placeholder — wire up once attachments exist */}
                                    {/*
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/40 p-3">
                    <Paperclip className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-400">attachment-name.pdf</span>
                  </div>
                  */}

                                    {/* Comments */}
                                    <div className="mt-3 border-t border-zinc-800 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                                            className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                                        >
                                            <MessageSquare size={14} />
                                            {isExpanded
                                                ? "Hide comments"
                                                : announcement.comments.length > 0
                                                    ? `View ${announcement.comments.length} comment${announcement.comments.length === 1 ? "" : "s"
                                                    }`
                                                    : "Add class comment"}
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-3 space-y-3">
                                                {announcement.comments.length === 0 ? (
                                                    <p className="text-sm text-zinc-500">
                                                        No comments yet. Be the first to say something.
                                                    </p>
                                                ) : (
                                                    announcement.comments.map((comment) => (
                                                        <div key={comment.id} className="flex items-start gap-3">
                                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200">
                                                                {getInitials(comment.author)}
                                                            </div>
                                                            <div className="min-w-0 flex-1 rounded-2xl bg-zinc-800/60 px-3 py-2">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm font-medium text-zinc-100">
                                                                        {comment.author}
                                                                    </span>
                                                                    {comment.role === "Instructor" && (
                                                                        <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                                                                            Instructor
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-zinc-500">
                                                                        {comment.createdAt}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-0.5 text-sm text-zinc-300">{comment.content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}

                                                {/* ============ BACKEND: POST comment ============ */}
                                                {/*
                        const res = await public_api_call(
                          `/classrooms/${classroomId}/announcements/${announcement.id}/comments`,
                          { method: "POST", body: { content } }
                        );
                        */}
                                                <div className="flex items-center gap-3 pt-1">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200">
                                                        Y
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Add class comment..."
                                                        className="flex-1 rounded-full border border-zinc-700 bg-zinc-800/40 px-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none transition-colors focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AnnouncementModal
                    className={classroom.name}
                    onClose={() => setIsModalOpen(false)}
                    onPost={handlePost}
                />
            )}
        </div>
    );
}