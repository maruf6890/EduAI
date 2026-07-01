import type { ClassroomCard } from "@/components/classroom/Cardflip"



export const dummyClassrooms: ClassroomCard[] = [
    {
        id: '1',
        name: 'Advanced Mathematics',
        courseCode: 'MATH 401',
        instructor: 'Dr. Elena Carter',
        accentGradient: 'from-violet-600 via-purple-500 to-indigo-600',
        semester: 'Spring 2025',
        role: 'teacher',
        stats: { students: 34, materials: 18, assignments: 7, quizzes: 4 },
        upcoming: [
            { id: 'u1', title: 'Calculus Problem Set 5', type: 'assignment', dueAt: 'Tomorrow, 11:59 PM' },
            { id: 'u2', title: 'Midterm Quiz — Integration', type: 'quiz', dueAt: 'Fri, 10:00 AM' },
            { id: 'u3', title: 'Office Hours moved to Thursday', type: 'announcement', dueAt: 'Today' },
        ],
        // aiInsight:
        //     'Submission rate dropped 12% this week. Consider sending a reminder — students who engage with materials 48 hrs early score 23% higher.',
    },
    {
        id: '2',
        name: 'Introduction to Physics',
        courseCode: 'PHYS 101',
        instructor: 'Prof. James Okafor',
        accentGradient: 'from-cyan-500 via-sky-500 to-blue-600',
        semester: 'Spring 2025',
        role: 'student',
        stats: { students: 52, materials: 24, assignments: 9, quizzes: 6 },
        upcoming: [
            { id: 'u1', title: "Newton's Laws Lab Report", type: 'assignment', dueAt: 'Wed, 11:59 PM' },
            { id: 'u2', title: 'Chapter 4 Recap Quiz', type: 'quiz', dueAt: 'Thu, 9:00 AM' },
            { id: 'u3', title: 'Guest lecture this Friday', type: 'announcement', dueAt: 'Today' },
        ],
        // aiInsight:
        //     "You've completed 78% of materials — above class average. Focus on the remaining motion chapters before Thursday's quiz.",
    },
    {
        id: '3',
        name: 'World Literature',
        courseCode: 'LIT 210',
        instructor: 'Dr. Aisha Mensah',
        accentGradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
        semester: 'Spring 2025',
        role: 'student',
        stats: { students: 28, materials: 31, assignments: 5, quizzes: 2 },
        upcoming: [
            { id: 'u1', title: 'Essay: Post-colonial Narratives', type: 'assignment', dueAt: 'Mon, 11:59 PM' },
            { id: 'u2', title: 'Chapters 12–15 Discussion Post', type: 'assignment', dueAt: 'Sun, 6:00 PM' },
            { id: 'u3', title: 'New reading list published', type: 'announcement', dueAt: 'Just now' },
        ],
        // aiInsight:
        //     'Discussion post engagement is high in your class. Participating early increases visibility and typically correlates with better essay grades.',
    },
    {
        id: '4',
        name: 'Data Structures & Algorithms',
        courseCode: 'CS 301',
        instructor: 'Prof. Lin Wei',
        accentGradient: 'from-emerald-500 via-teal-500 to-green-600',
        semester: 'Spring 2025',
        role: 'teacher',
        stats: { students: 41, materials: 27, assignments: 11, quizzes: 8 },
        upcoming: [
            { id: 'u1', title: 'Graph Traversal Assignment', type: 'assignment', dueAt: 'Fri, 11:59 PM' },
            { id: 'u2', title: 'Sorting Algorithms Quiz', type: 'quiz', dueAt: 'Thu, 2:00 PM' },
            { id: 'u3', title: 'Project groups announced', type: 'announcement', dueAt: 'Yesterday' },
        ],
        // aiInsight:
        //     '6 students have not opened the BFS/DFS material. Reaching out to struggling students now can prevent late withdrawals.',
    },
];