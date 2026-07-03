

import { ReactNode } from "react";

import ClassroomTabs from "@/components/classroom/ClassroomTabs";
import { getCookie } from "@/lib/cookies";
import { ClassroomProvider } from "./ClassroomProvider";
import { getClassroomDetails } from "./action";

export  default async function ClassroomLayout({
    children,params
}: {
    children: ReactNode;
    params: Promise<{ classroomId: string }>;
}) {
    const resolvedParams = await params;
    const user_id = await getCookie("id");
    console.log("User ID from cookie:", user_id);
    const classroomDetails = await getClassroomDetails(resolvedParams.classroomId as string);
    console.log("Classroom Details:", classroomDetails);
 

    return (
      <div className="max-w-7xl mx-auto bg-bg-main">
            <ClassroomProvider classroom={{
                id: classroomDetails?.id ?? "",
                name: classroomDetails?.name ?? "",
                course_code: classroomDetails?.course_code ?? "",
                course_title: classroomDetails?.course_title ?? "",
                description: classroomDetails?.description ?? "",
                semester: classroomDetails?.semester ?? "",
                teacher: {
                    id: classroomDetails?.owner_id ?? "",
                    name: classroomDetails?.owner_name ?? "",
                },
                current_user: {
                    id: user_id ?? "",
                    role: classroomDetails?.owner_id === user_id ? "teacher" : "student",
                },
        }}>
          <ClassroomTabs classroomId={resolvedParams.classroomId as string} />
          {children}
        </ClassroomProvider>
      </div>
    );
}