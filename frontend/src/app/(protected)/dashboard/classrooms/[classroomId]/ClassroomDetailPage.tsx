"use client";


import { useContext, useEffect, useState } from "react";
import { private_api_call } from "@/actions/private_api_call";

import AnnouncementModal from "@/components/classroom/Announcementmodal";
import { useParams } from "next/navigation";
import { ClassroomContext, useClassroom } from "./ClassroomContext";
import { ClassroomProvider } from "./ClassroomProvider";
import ClassroomHeader from "@/components/classroom/ClassroomHeader";
import { Check, ClipboardCopy, Clock, GraduationCap, Megaphone, Paperclip, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";




interface Comment {
  id: string;
  author: string;
  role?: "Instructor" | "Student";
  content: string;
  createdAt: string;
}

interface AnnouncementFile {
  id: number | string;
  file_name: string;
  file_url: string;
  file_type?: string;
  uploaded_at?: string;
}

interface Announcement {
  id: string;
  title: string;
  role: "Instructor" | "Student";
  content: string;
  createdAt: string;
  files: AnnouncementFile[];
  comments: Comment[];
}

interface BackendAnnouncement {
  id: number | string;
  title: string;
  content?: string | null;
  files?: AnnouncementFile[] | string[];
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

function normalizeFiles(raw: AnnouncementFile[] | string[] | undefined): AnnouncementFile[] {
  if (!raw || raw.length === 0) return [];
  // Backend always returns file objects, but tolerate legacy string arrays.
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return {
        id: entry,
        file_name: entry.split("/").pop() || "attachment",
        file_url: entry,
        file_type: undefined,
      };
    }
    return entry;
  });
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
    role: "Instructor",
    content: item.content ?? "",
    createdAt: formatRelativeTime(item.created_at ?? item.createdAt),
    files: normalizeFiles(item.files),
    // No comment endpoints exist in the provided API surface —
    // comments stay local/UI-only until that's added on the backend.
    comments: [],
  };
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const classroomId = params.classroomId as string;


  const classroom = useClassroom();
  console.log("Classroom ID from params:", classroom);
  const isTeacher = classroom.current_user.role === "teacher";

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string>("");


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

  const handleUpdateSubmit = async (
    title: string,
    content: string,
    _files: File[],
  ) => {
    // Backend PUT endpoint only accepts title/content — file edits aren't
    // supported yet, so we drop `_files` intentionally.
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
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      <div className="flex w-full  flex-col gap-4 px-4 py-6">
        <ClassroomHeader
          code={joinCode}
          course={{
            id: classroom.id,
            name: classroom.name,
            course_code: classroom.course_code,
            semester: classroom.semester,
            teacher: classroom.teacher,
            description: classroom.description,
            course_title: classroom.course_title,
          }}
        />

        <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
          <Megaphone className="h-5 w-5 text-text-main" />
          <p className="text-xs uppercase tracking-[3px] text-text-muted  text-shadow-2xs">
            Announcements
          </p>
        </div>

        {classroom.current_user.role=== "teacher" && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-sm border  bg-bg-card px-5 py-4 text-left transition-colors hover:border-brand-primary/40  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary transition-colors group-hover:bg-brand-primary/30">
              <Megaphone className="h-5 w-5" />
            </div>

            <span className="flex-1 text-sm text-text-main">
              Announce something to your class
            </span>

            <Plus className="h-4 w-4 flex-shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
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
                <div
                  key={announcement.id}
                  className="rounded-2xl border  bg-bg-card p-5 "
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-semibold text-brand-primary">
                      <GraduationCap className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium capitalize text-foreground ">
                          {classroom.teacher.name}
                        </span>
                        {announcement.role === "Instructor" && (
                          <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                            Instructor
                          </span>
                        )}
                      </div>
                      <span className="text-xs flex items-center gap-1 text-zinc-500">
                        <Clock className="size-3" />
                        {announcement.createdAt}
                      </span>
                    </div>
                    {classroom.current_user.role === "teacher" && (
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
                    <h3 className="mt-2 text-sm font-semibold text-foreground">
                      {announcement.title}
                    </h3>
                  )}

                  {/* Content */}
                  {announcement.content && (
                    <p className=" whitespace-pre-line text-sm text-muted-foreground leading-relaxed ">
                      {announcement.content}
                    </p>
                  )}

                  {announcement.files.length > 0 && (
                    <div className="mt-4
            flex flex-wrap gap-3">
                      {announcement.files.map((file) => {
                        const isImage =
                          (file.file_type || "").startsWith("image/") ||
                          /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(
                            file.file_name,
                          );
                        return (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center gap-2 overflow-hidden rounded-sm border"
                          >
                            {isImage ? (
                              <img
                                src={file.file_url}
                                alt={file.file_name}
                                className="h-14 w-14 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-700/60 text-zinc-300">
                                <Paperclip className="h-4 w-4" />
                              </div>
                            )}
                            
                          </a>
                        );
                      })}
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
