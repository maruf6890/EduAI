"use client";

import { ClassroomContextType } from "@/lib/types/classrooms";
import { ClassroomContext } from "./ClassroomContext";


export function ClassroomProvider({
  classroom,
  children,
}: {
  classroom: ClassroomContextType;
  children: React.ReactNode;
}) {
  return (
    <ClassroomContext.Provider value={classroom}>
      {children}
    </ClassroomContext.Provider>
  );
}
