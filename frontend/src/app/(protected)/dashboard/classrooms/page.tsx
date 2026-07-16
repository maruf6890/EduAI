'use client';



import { useEffect, useState } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import CardFlip from '@/components/classroom/Cardflip';
import CreateClassroom from '@/components/classroom/CreateClassModal';
import EnrollClassroom from '@/components/classroom/EnrollClassModal';
import { cn } from '@/lib/utils';
import type { ClassroomCard, Classroom, CreatedClassroomDTO, EnrolledClassroomDTO } from '@/lib/types/classrooms';
import { mapCreatedClassrooms, mapEnrolledClassrooms } from '@/lib/mappers/classroom';
import { private_api_call } from '@/actions/private_api_call';
import { useRouter } from 'next/navigation';
import ChatbotButton from '@/components/chat/chatbotbutton';


async function fetchCreatedClassrooms(): Promise<ClassroomCard[]> {
    try {
        const res = await private_api_call({ path: 'classrooms', method: 'GET' });
        // console.log(res.data);
        const items: CreatedClassroomDTO[] = res.data ?? [];
        return mapCreatedClassrooms(items);
    } catch (err) {
        console.error('Failed to fetch created classrooms:', err);
        return [];
    }
}

async function fetchEnrolledClassrooms(): Promise<ClassroomCard[]> {
    try {
        const res = await private_api_call({ path: 'enrollments/my-classrooms', method: 'GET' });
        const items: EnrolledClassroomDTO[] = res.data ?? [];
        return mapEnrolledClassrooms(items);
    } catch (err) {
        console.error('Failed to fetch enrolled classrooms:', err);
        return [];
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassroomPage() {
    const [classrooms, setClassrooms] = useState<ClassroomCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const router = useRouter();


    const loadClassrooms = async () => {
        setIsLoading(true);
        setError(null);

        const [created, enrolled] = await Promise.all([
            fetchCreatedClassrooms(),
            fetchEnrolledClassrooms(),
        ]);
        setClassrooms([...created, ...enrolled]);
        setIsLoading(false);
    };
    useEffect(() => {
          const load = async () => {
            await loadClassrooms();
          };

          load();
    }, []);

    const handleClassroomCreated = (classroom: Classroom) => {
        setIsCreateOpen(false);
        if (classroom.id) {
            router.push(`/dashboard/classrooms/${classroom.id}`);
        }
    };

    const handleEnrollmentSuccess = () => {
        setIsJoinOpen(false);
        loadClassrooms();
    };

    return (
        <div className="min-h-screen bg-background text-white">


            <div
                className="pointer-events-none fixed inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <div className="relative z-10 mx-auto max-w-9xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary-500/10 px-3 py-1">
                            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-main sm:text-xl">
                            My Classrooms
                        </h1>
                        <p className="mt-1.5 max-w-md text-base leading-relaxed text-text-main/40">
                            Classes you teach and enrolled in, all in one place.
                        </p>
                    </div>

                    {/* Both actions are always visible — the dashboard now shows a
              mixed teacher/student view rather than being gated by a
              single page-level role. */}
                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            onClick={() => setIsJoinOpen(true)}
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-5 py-2.5',
                                'border border-brand-secondary/10 bg-brand-secondary/10 text-[13px] font-semibold text-text-main/80',
                                'transition-all duration-200 hover:bg-brand-secondary/10 hover:scale-[1.02] active:scale-[0.98]',
                            )}
                        >
                            <Plus className="h-4 w-4" /> Join Classroom
                        </button>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-5 py-2.5 bg-brand-primary text-[13px] font-semibold text-text-main',
                                'shadow-lg shadow-indigo-950/50 transition-all duration-200 hover:bg-brand-secondary hover:scale-[1.02] active:scale-[0.98] text-white',
                            )}
                        >
                            <Plus className="h-4 w-4" /> Create Classroom
                        </button>
                    </div>
                </div>

                {/* Loading / Error / Data Rendering */}
                {isLoading ? (
                    <div className="py-20 text-center text-white/30">Loading your classrooms...</div>
                ) : error ? (
                    <div className="py-20 text-center text-red-400">{error}</div>
                ) : classrooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <GraduationCap className="mb-4 h-12 w-12 text-text-main/10" />
                        <h2 className="text-lg font-semibold text-text-main/40">No classrooms yet</h2>
                        <p className="mt-1 text-[13px] text-text-main/25">
                            Create a class or join one with a class code to get started.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {classrooms.map((classroom) => (
                            <CardFlip key={`${classroom.role}-${classroom.id}`} classroom={classroom} />
                        ))}
                    </div>
                )}
            </div>
            <ChatbotButton />

            <CreateClassroom open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={handleClassroomCreated} />
            <EnrollClassroom open={isJoinOpen} onOpenChange={setIsJoinOpen} onSuccess={handleEnrollmentSuccess} />

        </div>
    );
}

