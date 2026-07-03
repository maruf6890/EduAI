"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";

import ClassroomTabs from "@/components/classroom/ClassroomTabs";

export default function ClassroomLayout({
    children,
}: {
    children: ReactNode;
}) {
    const params = useParams();

    return (
        <>
            <ClassroomTabs classroomId={params.classroomId as string} />
            {children}
        </>
    );
}