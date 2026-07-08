"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { private_api_call } from "@/actions/private_api_call";
import { CommunityClassroom } from "./types";
import SearchBar from "./SearchBar";
import CommunityClassroomCard from "./CommunityClassroomCard";
import EmptyState from "./EmptyState";
import JoinAsTeacherDialog from "./JoinAsTeacherDialog";
import RequestClassroomModal from "./RequestClassroomModal";

export default function CommunityClassroomsPage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [debouncedTopic, setDebouncedTopic] = useState("");
  const [classrooms, setClassrooms] = useState<CommunityClassroom[]>([]);
  const [loading, setLoading] = useState(true);

  const [joiningStudentId, setJoiningStudentId] = useState<number | null>(null);
  const [teacherDialogClassroom, setTeacherDialogClassroom] = useState<CommunityClassroom | null>(null);
  const [isJoiningTeacher, setIsJoiningTeacher] = useState(false);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTopic(topic.trim()), 400);
    return () => clearTimeout(t);
  }, [topic]);

  const loadClassrooms = useCallback(async (searchTopic: string) => {
    setLoading(true);
    try {
      const path = searchTopic
        ? `community-classrooms?topic=${encodeURIComponent(searchTopic)}`
        : "community-classrooms";
      const res = await private_api_call({ method: "GET", path });
      if (res.success) {
        setClassrooms(res.data ?? []);
      } else {
        toast.error(res.message || "Failed to load community classrooms");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load community classrooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClassrooms(debouncedTopic);
  }, [debouncedTopic, loadClassrooms]);

  // ── Join as student ─────────────────────────────────────────────────────────
  async function handleJoinAsStudent(classroom: CommunityClassroom) {
    setJoiningStudentId(classroom.id);
    try {
      const res = await private_api_call({
        method: "POST",
        path: `community-classrooms/${classroom.id}/join-as-student`,
      });
      if (res.success) {
        toast.success("Joined successfully");
        router.push(`/dashboard/classrooms/${classroom.id}`);
      } else {
        toast.error(res.message || "Failed to join classroom");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join classroom");
    } finally {
      setJoiningStudentId(null);
    }
  }

  // ── Join as teacher (after confirmation dialog) ───────────────────────────────
  async function handleConfirmJoinAsTeacher() {
    if (!teacherDialogClassroom) return;
    setIsJoiningTeacher(true);

    try {
      const res = await private_api_call({
        method: "POST",
        path: `community-classrooms/${teacherDialogClassroom.id}/join-as-teacher`,
      });
      if (res.success) {
        toast.success("You are now the teacher of this classroom");
        const classroomId = teacherDialogClassroom.id;
        setTeacherDialogClassroom(null);
        router.push(`/dashboard/classrooms/${classroomId}`);
      } else {
        toast.error(res.message || "Failed to join as teacher");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join as teacher");
    } finally {
      setIsJoiningTeacher(false);
    }
  }

  function handleOpen(classroom: CommunityClassroom) {
    router.push(`/dashboard/classrooms/${classroom.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8168f3] to-[#6f57e0] shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Community Classrooms</h1>
            <p className="text-sm text-muted-foreground">Search a topic to find a study group</p>
          </div>
        </div>

        <Button
          onClick={() => setIsRequestModalOpen(true)}
          className="w-full gap-2 bg-[#8168f3] text-white hover:bg-[#6f57e0] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Request a classroom
        </Button>
      </div>

      <SearchBar value={topic} onChange={setTopic} />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <EmptyState topic={debouncedTopic} />
      ) : (
        <div className="flex flex-col gap-3">
          {classrooms.map((classroom) => (
            <CommunityClassroomCard
              key={classroom.id}
              classroom={classroom}
              onOpen={() => handleOpen(classroom)}
              onJoinAsTeacher={() => setTeacherDialogClassroom(classroom)}
              onJoinAsStudent={() => handleJoinAsStudent(classroom)}
              isJoiningTeacher={isJoiningTeacher && teacherDialogClassroom?.id === classroom.id}
              isJoiningStudent={joiningStudentId === classroom.id}
            />
          ))}
        </div>
      )}

      <JoinAsTeacherDialog
        classroom={teacherDialogClassroom}
        isSubmitting={isJoiningTeacher}
        onClose={() => setTeacherDialogClassroom(null)}
        onConfirm={handleConfirmJoinAsTeacher}
      />

      <RequestClassroomModal open={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} />
    </div>
  );
}
