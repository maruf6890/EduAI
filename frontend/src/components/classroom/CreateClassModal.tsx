"use client";

import React, { useState } from "react";
import { private_api_call } from "@/actions/private_api_call";
import type { Classroom } from "@/lib/types/classrooms";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FloatingFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

function FloatingField({
  label,
  required,
  value,
  onChange,
  autoFocus,
  disabled,
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false);

  const active = focused || value.length > 0;

  return (
    <div className="relative">
      <div
        className={`relative bg-bg-main rounded-t-md border-b-2 transition-colors ${
          focused ? "border-brand-primary" : "border-surface-border"
        }`}
      >
        <label
          className={`absolute left-4 transition-all pointer-events-none ${
            active
              ? "top-1.5 text-[11px]"
              : "top-1/2 -translate-y-1/2 text-base"
          } ${focused ? "text-brand-primary" : "text-text-main"}`}
        >
          {label}
          {required && <span className="text-brand-primary">*</span>}
        </label>

        <input
          autoFocus={autoFocus}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent outline-none pt-6 pb-2 px-4 text-base text-text-main disabled:opacity-60"
        />
      </div>
    </div>
  );
}

interface CreateClassroomProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (classroom: Classroom) => void;
}

export default function CreateClassroom({
  open,
  onOpenChange,
  onSuccess,
}: CreateClassroomProps) {
  const [name, setName] = useState("");
  const [course_code, setCourse_code] = useState("");
  const [course_title, setCourse_title] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setCourse_code("");
    setCourse_title("");
    setDescription("");
    setSemester("");
    setError(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (isSubmitting) return;

    if (!value) {
      resetForm();
    }

    onOpenChange(value);
  };

  const handleCreate = async () => {
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const classroom = await private_api_call({
        path: "classrooms",
        method: "POST",
        body: {
          name,
          course_code,
          course_title,
          description,
          semester,
        },
      });

      resetForm();
      onSuccess(classroom.data);
      onOpenChange(false);
    } catch {
      setError("Something went wrong creating the class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          max-w-md!
          border
          border-brand-primary/50
          bg-bg-main
          sm:rounded-md
          p-7
        "
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Create Classroom
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 ">
          <FloatingField
            label="Class name"
            required
            value={name}
            onChange={setName}
            autoFocus
            disabled={isSubmitting}
          />

          <FloatingField
            label="Course code"
            value={course_code}
            onChange={setCourse_code}
            disabled={isSubmitting}
          />

        <FloatingField
             required
            label="Course title"
            value={course_title}
            onChange={setCourse_title}
            disabled={isSubmitting}
          />

         <FloatingField
            required
            label="Description"
            value={description}
            onChange={setDescription}
            disabled={isSubmitting}
          />

          <FloatingField
            label="Semester"
            value={semester}
            onChange={setSemester}
            disabled={isSubmitting}
          />

        

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter className="mt-3 bg-transparent!">
          <button
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || isSubmitting}
            className="px-4 py-2 rounded-md bg-brand-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
