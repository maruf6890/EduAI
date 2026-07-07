"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CommunityClassroom } from "./types";

export default function JoinAsTeacherDialog({
  classroom,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  classroom: CommunityClassroom | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!classroom} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Join as teacher?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll become the sole teacher of{" "}
            <span className="font-medium text-foreground">{classroom?.course_title}</span>. Once
            you join, no one else can claim the teacher role for this classroom.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-[#8168f3] text-white hover:bg-[#6f57e0]"
          >
            {isSubmitting ? "Joining..." : "Yes, join as teacher"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
