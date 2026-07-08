
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
import PageTitle from "../materials/PageTitle";
import { GraduationCap, LucideIcon, Users } from "lucide-react";

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

    const renderSection = (title: string, members: Member[], icon: LucideIcon) => (
        <div className="mb-10">
            <PageTitle title={title} icon={icon} />
            <Table className="my-5">
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
        <div className="w-full p-4 space-y-3">
            {renderSection("Teachers", [data.teacher], GraduationCap)}
            {renderSection("Classmates", data.students,Users)}
        </div>
    );
}