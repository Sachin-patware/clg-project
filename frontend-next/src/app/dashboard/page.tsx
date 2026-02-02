"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, User, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import API_BASE_URL from '@/config';
import { Toast, ToastType } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface Teacher {
    allocation_id: number;
    teacher_name: string;
    is_submitted: boolean;
}

interface Subject {
    subject_code: string;
    teachers: Teacher[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: ToastType; visible: boolean }>({
        msg: '',
        type: 'info',
        visible: false,
    });

    const showToast = (msg: string, type: ToastType) => {
        setToast({ msg, type, visible: true });
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            // Need credentials: 'include' for session based auth if backend needs cookies
            const res = await fetch(`${API_BASE_URL}/my-teachers/`, {
                method: "GET",
                credentials: "include",
            });

            const data = await res.json();

            if (data.status === "ok") {
                setTeachers(data.subjects);
            } else {
                showToast("Session expired or invalid. Please login again.", "error");
                // setTimeout(() => router.push('/'), 2000); 
                // Don't auto-redirect immediately so they see the error, maybe? 
                // Old code redirected immediately.
                router.push('/');
            }
        } catch (error) {
            console.error("Fetch teachers error:", error);
            showToast("Error connecting to server. Is backend running?", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGiveFeedback = (subjectCode: string, allocationId: number, teacherName: string) => {
        // Navigate to feedback page with params
        // Can use query params or dynamic route. 
        // Dynamic route /dashboard/feedback/[allocationId]?subject=...&name=... is cleaner.
        const params = new URLSearchParams({
            subjectCode,
            teacherName
        });
        router.push(`/dashboard/feedback/${allocationId}?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                </div>
                <p className="text-gray-600 font-medium">Loading your assigned teachers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toast
                message={toast.msg}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <div className="flex flex-col gap-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">My Teachers</h2>
                <p className="text-gray-600 font-medium">Select a teacher below to provide your valuable feedback.</p>
            </div>

            {teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-100 rounded-2xl border border-gray-200/50 shadow-sm text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Teachers Found</h3>
                    <p className="text-gray-600 max-w-md">
                        It looks like no teachers are assigned to you yet. Please contact your administrator.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teachers.map((subject, idx) => (
                        <motion.div
                            key={subject.subject_code}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-gray-100 rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group flex flex-col"
                        >
                            <div className="bg-gradient-to-br from-blue-300 to-indigo-500 p-5 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100/20 backdrop-blur-md rounded-lg">
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-none">{subject.subject_code}</h3>
                                        <p className="text-white/70 text-xs mt-1">Course Code</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-2">
                                <div className="divide-y divide-gray-50">
                                    {subject.teachers.map((teacher) => (
                                        <div key={teacher.allocation_id} className="p-4 flex flex-col gap-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                                                        {teacher.teacher_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-tight">{teacher.teacher_name}</p>
                                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-0.5">Academic Faculty</p>
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                                                    teacher.is_submitted
                                                        ? "bg-green-50 text-green-600 border border-green-100"
                                                        : "bg-red-50 text-red-600 border border-red-100"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", teacher.is_submitted ? "bg-green-500" : "bg-red-500 animate-pulse")} />
                                                    {teacher.is_submitted ? "Submitted" : "Pending"}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => !teacher.is_submitted && handleGiveFeedback(subject.subject_code, teacher.allocation_id, teacher.teacher_name)}
                                                disabled={teacher.is_submitted}
                                                className={cn(
                                                    "w-full group/btn relative px-4 py-2.5 text-sm font-bold transition-all overflow-hidden rounded-xl border flex items-center justify-center gap-2",
                                                    teacher.is_submitted
                                                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                                        : "bg-white text-blue-600 border-blue-100 hover:border-blue-600 hover:text-white"
                                                )}
                                            >
                                                {!teacher.is_submitted ? (
                                                    <>
                                                        <span className="relative z-10 flex items-center gap-2">
                                                            Give Feedback
                                                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </span>
                                                        <div className="absolute inset-0 bg-blue-400 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                        <span>Response Recorded</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
