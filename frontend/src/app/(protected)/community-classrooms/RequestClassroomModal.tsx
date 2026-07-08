"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { private_api_call } from "@/actions/private_api_call";
import { CommunityClassroom } from "./types";
import CommunityClassroomCard from "./CommunityClassroomCard";
import JoinAsTeacherDialog from "./JoinAsTeacherDialog";

type Step = "form" | "results";

export default function RequestClassroomModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [relatedClassrooms, setRelatedClassrooms] = useState<CommunityClassroom[]>([]);
  const [joiningStudentId, setJoiningStudentId] = useState<number | null>(null);
  const [teacherDialogClassroom, setTeacherDialogClassroom] = useState<CommunityClassroom | null>(null);
  const [isJoiningTeacher, setIsJoiningTeacher] = useState(false);

  function resetAndClose() {
    setStep("form");
    setTitle("");
    setDescription("");
    setRelatedClassrooms([]);
    onClose();
  }

  // ── Step 1: save the request — backend also returns related classrooms ──────
  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await private_api_call({
        method: "POST",
        path: "classroom-requests",
        body: {
          title: title.trim(),
          description: description.trim() || null,
        },
      });

      if (!res.success) {
        toast.error(res.message || "Failed to submit request");
        return;
      }
      console.log("Request submitted successfully:", res.data);
      setRelatedClassrooms([]);
      toast.success("Your request has been submitted");
      setStep("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 2: join a related classroom ─────────────────────────────────────────
  async function handleJoinAsStudent(classroom: CommunityClassroom) {
    setJoiningStudentId(classroom.id);
    try {
      const res = await private_api_call({
        method: "POST",
        path: `community-classrooms/${classroom.id}/join-as-student`,
      });
      if (res.success) {
        toast.success("Joined successfully");
        resetAndClose();
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
        resetAndClose();
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

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {step === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>Request a classroom</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="request_title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="request_title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Cyber Security"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="request_description">Description</Label>
                  <Textarea
                    id="request_description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What would you like to learn or discuss in this classroom?"
                  />
                </div>

                <DialogFooter className="mt-2 flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetAndClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!title.trim() || isSubmitting}
                    className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
                  >
                    {isSubmitting ? "Submitting..." : "Request"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Related community classrooms</DialogTitle>
              </DialogHeader>

              <p className="text-sm text-muted-foreground">
                Your request for &quot;{title}&quot; has been saved. Here&apos;s what already
                exists — join one below, or close this and wait for a new classroom to be created.
              </p>

              {relatedClassrooms.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                  No related classrooms found yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {relatedClassrooms.map((classroom) => (
                    <CommunityClassroomCard
                      key={classroom.id}
                      classroom={classroom}
                      onOpen={() => {
                        resetAndClose();
                        router.push(`/dashboard/classrooms/${classroom.id}`);
                      }}
                      onJoinAsTeacher={() => setTeacherDialogClassroom(classroom)}
                      onJoinAsStudent={() => handleJoinAsStudent(classroom)}
                      isJoiningTeacher={isJoiningTeacher && teacherDialogClassroom?.id === classroom.id}
                      isJoiningStudent={joiningStudentId === classroom.id}
                    />
                  ))}
                </div>
              )}

              <DialogFooter className="mt-2 flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <JoinAsTeacherDialog
        classroom={teacherDialogClassroom}
        isSubmitting={isJoiningTeacher}
        onClose={() => setTeacherDialogClassroom(null)}
        onConfirm={handleConfirmJoinAsTeacher}
      />
    </>
  );
}
