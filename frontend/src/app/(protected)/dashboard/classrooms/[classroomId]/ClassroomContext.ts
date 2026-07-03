"use client";
import { ClassroomContextType } from "@/lib/types/classrooms";
import { createContext, useContext } from "react";

export const ClassroomContext = createContext<ClassroomContextType | null>(null);

export const useClassroom = () => {
  const context = useContext(ClassroomContext);

  if (!context) {
    throw new Error("useClassroom must be used within ClassroomProvider");
  }

  return context;
};
