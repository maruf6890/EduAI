"use client";


import { useEffect, useState } from "react";
import { private_api_call } from "@/actions/private_api_call";

import AnnouncementModal from "@/components/classroom/Announcementmodal";
import { useParams } from "next/navigation";
import { useClassroom } from "./ClassroomContext";
import { ClassroomProvider } from "./ClassroomProvider";



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
  // author: string;
  role: "Instructor" | "Student";
  content: string;
  createdAt: string;
  files: string[];
  comments: Comment[];
}

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
    // author: authorName,
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

  const classroom = useClassroom();

  // const classroom = {
  //   id: classroomId,
  //   name: `Classroom ${classroomId}`,
  //   stats: {
  //     students: 10,
  //     assignments: 5,
  //     quizzes: 3,
  //     announcements: 2,
  //     calendar: 1,
  //   },
  // };
  const isTeacher = classroom.current_user.role === "teacher";
  // console.log("Classroom Context:", classroom);
  // console.log("Is Teacher:", isTeacher);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAnnouncements = async () => {
      setIsLoading(true);
      const endpoint = isTeacher
        ? `classrooms/${classroomId}/announcements/teacher`
        : `classrooms/${classroomId}/announcements/student`;

      const res = await private_api_call({ path: endpoint, method: "GET" });

      if (!isMounted) return;

      if (res.success && Array.isArray(res.data)) {
        console.log(res.data);
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
      path: `classrooms/${classroomId}/announcements`,
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

  const handleOpenCreateModal = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = async (title: string, content: string) => {
    if (!editingAnnouncement) return;
    await handleEditAnnouncement(editingAnnouncement.id, { title, content });
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    const res = await private_api_call({
      path: `classrooms/${classroomId}/announcements/${announcementId}`,
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

  useEffect(() => {
    async function loadJoinCode() {
      const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/join-code`,
      });

      if (res.success) {
        setJoinCode(res.data.join_code);
      }
    }

    loadJoinCode();
  }, [classroomId]);

  async function handleCopyCode() {
    await navigator.clipboard.writeText(joinCode);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  const handleEditAnnouncement = async (
    announcementId: string,
    updates: { title?: string; content?: string },
  ) => {
    const res = await private_api_call({
      path: `classrooms/${classroomId}/announcements/${announcementId}`,
      method: "PUT",
      body: updates,
    });

    if (res.success && res.data) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId ? mapAnnouncement(res.data) : a,
        ),
      );
    } else {
      console.error("Failed to update announcement:", res.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      <div className="flex w-full  flex-col gap-4 px-4 py-6">
        <div className="rounded-xl border border-white/10 bg-bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Classroom Code
          </p>

          <div className="mt-3 flex items-center justify-between">
            {isTeacher && (
              <span className="text-2xl font-bold tracking-[0.25em]">

                {joinCode}
              </span>
            )}
            {!isTeacher && (
              <h3 className="text-2xl font-bold tracking-[0.25em]">
                Class code is only visible to your teacher.
              </h3>
            )}

            {isTeacher && (
              <button
                onClick={handleCopyCode}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm text-white transition hover:opacity-90"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        </div>
        {isTeacher && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-left shadow-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-semibold text-brand-primary">
              Y
            </div>
            <span className="text-sm text-text-main">
              Announce something to your class
            </span>
          </button>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">Loading announcements…</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">
              No announcements yet. Post something to get the conversation
              started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {announcements.map((announcement) => {
              const isExpanded = expandedId === announcement.id;

              return (
                // <div
                //   // // key={announcement.id}
                //   // key={classroom.teacher.name}
                //   // className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm"

                <div
                  key={announcement.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-semibold text-brand-primary">
                      {getInitials(classroom.teacher.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-zinc-100">
                          {classroom.teacher.name}
                        </span>
                        {announcement.role === "Instructor" && (
                          <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                            Instructor
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {announcement.createdAt}
                      </span>
                    </div>
                    {isTeacher && (
                      <div className="ml-auto flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(announcement)}
                          className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteAnnouncement(announcement.id)
                          }
                          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
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

                </div>
              );
            })}
          </div>
        )}
      </div>
      {isModalOpen && (
        <AnnouncementModal
          className={classroom.name}
          mode={editingAnnouncement ? "edit" : "create"}
          initialTitle={editingAnnouncement?.title ?? ""}
          initialContent={editingAnnouncement?.content ?? ""}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAnnouncement(null);
          }}
          onPost={editingAnnouncement ? handleUpdateSubmit : handlePost}
        />
      )}
    </div>
  );
}
