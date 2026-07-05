// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { GraduationCap, Clock, User, Check, X } from 'lucide-react';
// import { Card } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// interface QuestionSubmission {
//     question_id: number;
//     question_text: string;
//     selected_option: string | null;
//     correct_option: string;
//     is_correct: boolean | null;
//     explanation: string | null;
// }

// interface Submission {
//     id: number;
//     quiz_title: string;
//     submission_time: string;
//     total_questions: number;
//     correct_answers: number;
//     score: string;
//     questions: QuestionSubmission[];
// }

// interface SubmissionSummary {
//     id: number;
//     student_name: string;
//     score: number;
//     status: 'pass' | 'fail';
//     submitted_at: string;
// }

// async function fetchSubmissions(classroomId: string, quizId: string): Promise<Submission[]> {
//     const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
//     const res = await fetch(`http://localhost:8000/api/v1/classrooms/${classroomId}/quizzes/${quizId}/submissions`, {
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });

//     if (!res.ok) {
//         if (res.status === 404) {
//             return [];
//         }
//         const error = await res.json();
//         throw new Error(error.detail || 'Failed to fetch submissions');
//     }

//     const data = await res.json();
//     return data;
// }

// async function fetchSubmissionSummary(classroomId: string, quizId: string): Promise<SubmissionSummary[]> {
//     const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
//     const res = await fetch(`http://localhost:8000/api/v1/classrooms/${classroomId}/quizzes/${quizId}/submissions/summary`, {
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     });

//     if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.detail || 'Failed to fetch submission summary');
//     }

//     const data = await res.json();
//     return data;
// }

// function formatDateTime(iso: string): string {
//     return new Date(iso).toLocaleString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit',
//         hour12: true,
//     });
// }

// export default function QuizSubmissionsPage({ params }: { params: { classroomId: string; quizId: string } }) {
//     const { classroomId, quizId } = params;
//     const router = useRouter();

//     const [submissions, setSubmissions] = useState<Submission[]>([]);
//     const [summary, setSummary] = useState<SubmissionSummary[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

//     useEffect(() => {
//         const loadData = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);

//                 const [submissionsData, summaryData] = await Promise.all([
//                     fetchSubmissions(classroomId, quizId),
//                     fetchSubmissionSummary(classroomId, quizId)
//                 ]);

//                 setSubmissions(submissionsData);
//                 setSummary(summaryData);

//                 if (submissionsData.length > 0) {
//                     setSelectedSubmissionId(submissionsData[0].id);
//                 }
//             } catch (err) {
//                 console.error('Error loading submissions:', err);
//                 setError(err instanceof Error ? err.message : 'Failed to load submissions');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         loadData();
//     }, [classroomId, quizId]);

//     const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center">
//                 <p className="text-white">Loading submissions...</p>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center">
//                 <p className="text-red-400">Error: {error}</p>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-[#0C0D10] text-white">
//             {/* Header */}
//             <div className="fixed top-0 left-0 right-0 z-20 border-b border-white/10 bg-[#0C0D10]/80 backdrop-blur-lg">
//                 <div className="mx-auto max-w-9xl px-4 sm:px-6 lg:px-8 py-4">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-3">
//                             <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 onClick={() => router.push(`/dashboard/classrooms/${classroomId}`)}
//                                 className="hover:bg-white/10"
//                             >
//                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                                 </svg>
//                             </Button>
//                             <div>
//                                 <h1 className="text-lg font-semibold text-white">Submissions</h1>
//                                 <p className="text-xs text-white/50">Classroom {classroomId} • Quiz {quizId}</p>
//                             </div>
//                         </div>
//                         <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => router.push('/dashboard/classrooms')}
//                             className="hover:bg-white/10"
//                         >
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                         </Button>
//                     </div>
//                 </div>
//             </div>

//             {/* Main Content */}
//             <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                     {/* Left Side: Submission List */}
//                     <div className="lg:col-span-1">
//                         <div className="sticky top-28 space-y-4">
//                             <Card className="bg-[#0F1115] border-white/10">
//                                 <div className="p-4 border-b border-white/10">
//                                     <h3 className="text-sm font-semibold">All Submissions</h3>
//                                 </div>
//                                 <div className="max-h-96 overflow-y-auto scrollbar-hide">
//                                     {summary.length === 0 ? (
//                                         <div className="p-4 text-center text-white/30">
//                                             <p>No submissions yet</p>
//                                         </div>
//                                     ) : (
//                                         summary.map((item) => (
//                                             <div
//                                                 key={item.id}
//                                                 onClick={() => setSelectedSubmissionId(item.id)}
//                                                 className={`p-3 cursor-pointer transition-colors ${selectedSubmissionId === item.id
//                                                     ? 'bg-white/5'
//                                                     : 'hover:bg-white/5'
//                                                     }`}
