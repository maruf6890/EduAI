export interface Member {
    id: string;
    full_name: string;
    email: string;
    role: 'Teacher' | 'Student';
}

export interface PeopleData {
    teacher: Member;
    students: Member[];
}