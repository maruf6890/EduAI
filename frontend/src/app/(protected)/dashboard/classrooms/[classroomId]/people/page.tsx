// "use client";

// import { useClassroom } from "../ClassroomContext";
// import { useParams } from "next/navigation";
// import { User, GraduationCap } from "lucide-react";

// interface Student {
//     id: number;
//     name: string;
//     email: string;
//     avatar?: string | null;
// }

// export default function StudentsPage() {
//     const params = useParams();
//     const classroomId = params?.classroomId as string;

//     const classroom = useClassroom();

//     // 🔥 adjust these depending on your backend shape
//     const instructor = classroom.instructor;
//     const students: Student[] = classroom.students || [];

//     return (
//         <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">

//             {/* HEADER */}
//             <div className="flex flex-col gap-2">
//                 <h1 className="text-xl font-semibold text-zinc-100">
//                     Class Members
//                 </h1>
//                 <p className="text-sm text-zinc-500">
//                     {students.length} students enrolled
//                 </p>
//             </div>

//             {/* INSTRUCTOR SECTION */}
//             <div className="rounded-xl border border-brand-primary bg-zinc-900 p-4">
//                 <div className="flex items-center gap-3 mb-3">
//                     <GraduationCap className="h-5 w-5 text-brand-primary" />
//                     <h2 className="text-sm font-medium text-zinc-200">
//                         Instructor
//                     </h2>
//                 </div>

//                 <div className="flex items-center gap-3">
//                     <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
//                         <User className="h-5 w-5 text-zinc-400" />
//                     </div>

//                     <div>
//                         <p className="text-sm font-medium text-zinc-100">
//                             {instructor?.name || "Unknown Instructor"}
//                         </p>
//                         <p className="text-xs text-zinc-500">
//                             {instructor?.email}
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             {/* STUDENTS LIST */}
//             <div className="flex flex-col gap-3">
//                 {students.length === 0 ? (
//                     <div className="text-center text-sm text-zinc-500 py-10 border border-dashed border-zinc-700 rounded-xl">
//                         No students enrolled yet
//                     </div>
//                 ) : (
//                     students.map((student) => (
//                         <StudentCard key={student.id} student={student} />
//                     ))
//                 )}
//             </div>
//         </div>
//     );
// }

// /* =========================
//    STUDENT CARD
// ========================= */

// function StudentCard({ student }: { student: Student }) {
//     return (
//         <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-900/60 transition">

//             {/* LEFT */}
//             <div className="flex items-center gap-3">
//                 <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
//                     <User className="h-5 w-5 text-zinc-400" />
//                 </div>

//                 <div>
//                     <p className="text-sm font-medium text-zinc-100">
//                         {student.name}
//                     </p>
//                     <p className="text-xs text-zinc-500">
//                         {student.email}
//                     </p>
//                 </div>
//             </div>

//             {/* RIGHT (optional role badge placeholder) */}
//             <div className="text-xs text-zinc-400 border border-zinc-700 px-2 py-1 rounded-full">
//                 Student
//             </div>
//         </div>
//     );
// }

"use client";

import { useParams } from "next/navigation";

import { useEffect, useState } from "react";
import { private_api_call } from "@/actions/private_api_call";
import {
    Table,
    TableBody,
    TableCell,
    TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Member, PeopleData } from "./types";
import { useClassroom } from "../ClassroomContext";

export default function PeoplePage() {
    const params = useParams();
    const classroomId = params?.classroomId as string;
    const classroom = useClassroom();
    const currentUserRole = classroom.current_user.role;

    const [data, setData] = useState<PeopleData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classroomId) return;
        async function loadPeople() {
            setLoading(true);
            const res = await private_api_call({
                method: "GET",
                path: `classrooms/${classroomId}/people`,
            });
            if (res.success) setData(res.data);
            setLoading(false);
        }
        loadPeople();
    }, [classroomId]);

    if (loading) return <div className="p-8 text-center">Loading members...</div>;
    if (!data) return <div className="p-8 text-center">No members found.</div>;

    const renderSection = (title: string, members: Member[]) => (
        <div className="mb-10">
            <h2 className="text-xl font-semibold border-b pb-3 mb-2">{title}</h2>
            <Table>
                <TableBody>
                    {members.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell className="w-12">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{member.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium text-base">{member.full_name}</TableCell>
                            {currentUserRole === "teacher" && (
                                <TableCell className="text-muted-foreground text-right">{member.email}</TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6">
            {renderSection("Teachers", [data.teacher])}
            {renderSection("Classmates", data.students)}
        </div>
    );
}