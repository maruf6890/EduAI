"use client";

/**
 * @description: Classroom Detail Page
 * @route: /dashboard/classrooms/[classroomId]/contains announcements and other options
 */

import { useEffect, useState } from "react";
import { private_api_call } from "@/actions/private_api_call";
import ClassroomHeader from "@/components/classroom/ClassroomHeader";
import ClassroomTabs from "@/components/classroom/ClassroomTabs";
import AnnouncementModal from "@/components/classroom/Announcementmodal";
import type { Classroom } from "@/lib/types/classrooms";


import { MessageSquare } from "lucide-react";
import { useParams } from "next/navigation";

// interface ClassroomDetailPageProps {
//     params: {
//         classroomId: string;
//     };
// }

interface Comment {
    id: string;
    author: string;
    role?: "Instructor" | "Student";
    content: string;
    createdAt: string;
}

interface Announcement {
    id: string;
    title: string;
    author: string;
    role: "Instructor" | "Student";
    content: string;
    createdAt: string;
    files: string[];
    comments: Comment[];
}

// ---- Shape guessed from the swagger form fields (title, content, files). ----
// Adjust field names here once you can see a real response payload —
// this is the only place that needs to change.
interface BackendAnnouncement {
    id: number | string;
    title: string;
    content?: string | null;
    files?: string[];
    created_at?: string;
    createdAt?: string;
    teacher?: { id: number; name?: string; full_name?: string };
    teacher_name?: string;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatRelativeTime(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function mapAnnouncement(item: BackendAnnouncement): Announcement {
    const authorName =
        item.teacher?.full_name ||
        item.teacher?.name ||
        item.teacher_name ||
        "Instructor";

    return {
        id: String(item.id),
        title: item.title,
        author: authorName,
        role: "Instructor",
        content: item.content ?? "",
        createdAt: formatRelativeTime(item.created_at ?? item.createdAt),
        files: item.files ?? [],
        // No comment endpoints exist in the provided API surface —
        // comments stay local/UI-only until that's added on the backend.
        comments: [],
    };
}

export default function ClassroomDetailPage() {

    const params = useParams();
    const classroomId = params.classroomId as string;
    // const { classroomId } = params;

    // ============ BACKEND: GET classroom ============
    // No classroom-detail endpoint was provided, so this stays mocked.
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

    // TODO: derive from auth/session once that's wired up.
    const isTeacher = true;

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchAnnouncements = async () => {
            setIsLoading(true);
            const endpoint = isTeacher
                ? `api/v1/classrooms/${classroomId}/announcements/teacher`
                : `api/v1/classrooms/${classroomId}/announcements/student`;

            const res = await private_api_call({ path: endpoint, method: "GET" });

            if (!isMounted) return;

            if (res.success && Array.isArray(res.data)) {
                setAnnouncements(res.data.map(mapAnnouncement));
            } else if (!res.success) {
                console.error("Failed to load announcements:", res.message);
            }
            setIsLoading(false);
        };

        fetchAnnouncements();
        return () => {
            isMounted = false;
        };
    }, [classroomId, isTeacher]);

    const handlePost = async (title: string, content: string, files: File[]) => {
        const formData = new FormData();
        formData.append("title", title);
        if (content) formData.append("content", content);
        files.forEach((file) => formData.append("files", file));

        const res = await private_api_call({
            path: `api/v1/classrooms/${classroomId}/announcements`,
            method: "POST",
            body: formData,
        });

        if (res.success && res.data) {
            setAnnouncements((prev) => [mapAnnouncement(res.data), ...prev]);
        } else {
            console.error("Failed to post announcement:", res.message);
        }

        setIsModalOpen(false);
    };

    const handleDeleteAnnouncement = async (announcementId: string) => {
        const res = await private_api_call({
            path: `api/v1/classrooms/${classroomId}/announcements/${announcementId}`,
            method: "DELETE",
        });

        if (res.success) {
            setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
        } else {
            console.error("Failed to delete announcement:", res.message);
        }
    };

    // Not wired to a button yet since there's no edit UI in this design —
    // call this from wherever you add an "Edit" action.
    const handleEditAnnouncement = async (
        announcementId: string,
        updates: { title?: string; content?: string },
    ) => {
        const res = await private_api_call({
            path: `api/v1/classrooms/${classroomId}/announcements/${announcementId}`,
            method: "PUT",
            body: updates,
        });

        if (res.success && res.data) {
            setAnnouncements((prev) =>
                prev.map((a) => (a.id === announcementId ? mapAnnouncement(res.data) : a)),
            );
        } else {
            console.error("Failed to update announcement:", res.message);
        }
    };

    return (
        <div className="min-h-screen bg-bg-main text-text-main">
            {/* <ClassroomHeader classroom={classroom} /> */}
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

                {isLoading ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center">
                        <p className="text-sm text-zinc-500">Loading announcements…</p>
                    </div>
                ) : announcements.length === 0 ? (
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

                                        {isTeacher && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                                className="ml-auto text-xs text-zinc-500 hover:text-red-400 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>

                                    {/* Title (required field from backend) */}
                                    {announcement.title && (
                                        <h3 className="mt-4 text-sm font-semibold text-zinc-100">
                                            {announcement.title}
                                        </h3>
                                    )}

                                    {/* Content */}
                                    {announcement.content && (
                                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                                            {announcement.content}
                                        </p>
                                    )}

                                    {/* Attachments from backend */}
                                    {/* Attachments from backend */}
                                    {announcement.files.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-2">
                                            {announcement.files.map((fileUrl, index) => (
                                                <a
                                                    key={fileUrl + index}
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/40 p-3 hover:border-zinc-700 transition-colors"
                                                >
                                                    <span className="text-sm text-zinc-400 truncate">
                                                        {fileUrl.split("/").pop()}
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {/* Comments — local only, no backend endpoint provided yet */}
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