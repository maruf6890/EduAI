"use client";

import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "../ui/button";
import {
  Megaphone,
  FolderOpen,
  ClipboardList,
  FileQuestion,
  Users,
  MessageSquare,
  Bot,
} from "lucide-react";

const TABS = [
  {
    key: "announcements",
    label: "Announcements",
    path: "",
    icon: Megaphone,
  },
  {
    key: "materials",
    label: "Materials",
    path: "materials",
    icon: FolderOpen,
  },
  {
    key: "assignments",
    label: "Assignments",
    path: "assignments",
    icon: ClipboardList,
  },
  {
    key: "quizzes",
    label: "Quizzes",
    path: "quizzes",
    icon: FileQuestion,
  },
  {
    key: "people",
    label: "People",
    path: "people",
    icon: Users,
  },
  {
    key: "discussion",
    label: "Discussion",
    path: "discussion",
    icon: MessageSquare,
  },
  {
    key: "assistant",
    label: "AI Assistant",
    path: "assistant",
    icon: Bot,
  },
] as const;

export default function ClassroomTabs({
  classroomId,
}: {
  classroomId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex gap-3 overflow-x-auto border-b border-white/[0.06] py-2">
        {TABS.map((tab) => {
          const fullPath = `/dashboard/classrooms/${classroomId}${
            tab.path ? `/${tab.path}` : ""
          }`;

          const isActive = pathname === fullPath;
          const Icon = tab.icon;

          return (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => router.push(fullPath)}
              className={cn(
                "shrink-0 rounded-md border px-4 py-2 text-[13px] font-medium transition-all",
                isActive
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                  : "border-border bg-surface text-muted-foreground hover:bg-brand-primary/5 hover:text-brand-primary",
              )}
            >
              <Icon className="mr-1 h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
