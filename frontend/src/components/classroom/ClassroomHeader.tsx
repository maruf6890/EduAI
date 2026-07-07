"use client";

import { BookOpen, CalendarDays, Check, ClipboardCopy, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { useState } from "react";

type ClassroomHeaderProps = {
  course: {
    id: string;
    name: string;
    course_code: string;
    course_title?: string;
    description?: string;
    semester: string;
    teacher: {
      id: string;
      name: string;
    };
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}


export default function ClassroomHeader({ course, code }: { course: ClassroomHeaderProps['course']; code: string }) {
    const [copied, setCopied] = useState(false);
  
     
  
     const handleCopy = async () => {
       await navigator.clipboard.writeText(code);
       setCopied(true);
  
       setTimeout(() => setCopied(false), 1500);
     };
  return (
    <div className="w-full overflow-hidden rounded-sm border border-border bg-background shadow-sm relative">
      {/* Accent bar — signature detail, ties the header to the course */}
      <div
        className={`absolute -left-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br opacity-20 from-sky-500 to-indigo-500`}
      />
      <div className="space-y-2 p-6 bg-gradient-to-r from-sky-200 to-indigo-500 bg-[length:400%_400%] animate-gradient-x">
        {/* Top Row */}
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          {/* LEFT */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground">
                <BookOpen className="h-3.5 w-3.5 text-foreground" />
                <span>{course.course_code}</span>
              </div>
              <Badge variant="ghost" className="gap-1 text-foreground font-normal">
                <CalendarDays className="h-3 w-3" />
                {course.semester}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {course.course_title || "Untitled Course"}
            </h1>
            <div className="flex items-center gap-1 font-semibold  text-sm text-foreground">
              <GraduationCap className="h-4 w-4" />
              <p className="text-sm  capitalize">{course.teacher.name}</p>
            </div>
          </div>

          {/* RIGHT — Instructor */}
          <div className="flex items-center gap-3 md:flex-row-reverse md:text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    onClick={handleCopy}
                    className="flex items-center gap-2  bg-brand-primary px-3 py-2 text-sm text-white transition hover:opacity-90"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <ClipboardCopy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>

                <TooltipContent>
                  <p>{copied ? "Code copied!" : "Copy classroom code"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <>
            <p className="text-sm leading-relaxed text-foreground/80">
              {course.description}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
