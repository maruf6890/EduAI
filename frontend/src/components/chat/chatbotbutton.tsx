'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ChatbotButton() {
    // us
    // eParams returns an object. Access the dynamic segment defined in your folder path.
    // Ensure the key matches your folder name: /dashboard/classrooms/[classroomId]/...
    const params = useParams();
    const classroomId = params.classroomId as string;

    // Optional: Don't render the button if the ID isn't available yet
    if (!classroomId) return null;

    return (
        <Link
            href={`/dashboard/classrooms/${classroomId}/assistant`}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md shadow-xl hover:bg-white/20 active:scale-95 transition-all duration-200 border border-white/10 hover:shadow-brand-primary/20 hover:shadow-2xl group"
            aria-label="Talk to AI Triage Assistant"
        >
            <div className="bg-brand-primary h-10 w-10 rounded-full flex items-center justify-center p-0.5 mix-blend-multiply transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:bg-brand-secondary">
                <img
                    src="https://img.icons8.com/ink/48/chatbot.png"
                    alt="chatbot"
                    className="h-8 w-8 object-contain"
                />
            </div>
        </Link>
    );
}