"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, User, ArrowRight, AlertCircle, Loader2, CheckCircle2, Star, Send, GraduationCap } from 'lucide-react';
import API_BASE_URL from '@/config';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Toast, ToastType } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface Teacher {
    allocation_id: number;
    teacher_name: string;
    is_submitted: boolean;
    subject_code: string;
    subject_name: string;
}

interface Subject {
    subject_code: string;
    subject_name: string;
    teachers: Teacher[];
}

interface FeedbackState {
    [allocationId: string]: {
        ratings: { [q: string]: number };
        comments: string;
    };
}

const QUESTION_LABELS = [
    { key: 'q1', label: 'Subject Knowledge' },
    { key: 'q6', label: 'Communication' },
    { key: 'q2', label: 'Punctuality' },
    { key: 'q7', label: 'Mentoring' },
    { key: 'q3', label: 'Syllabus Coverage' },
    { key: 'q8', label: 'Class Control' },
    { key: 'q4', label: 'Doubt Clearing' },
    { key: 'q9', label: 'Teaching Aids' },
    { key: 'q5', label: 'Interaction' },
    { key: 'q10', label: 'Overall Rating' },
];

export default function DashboardPage() {
    const router = useRouter();
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: ToastType; visible: boolean }>({
        msg: '',
        type: 'info',
        visible: false,
    });

    const [feedbacks, setFeedbacks] = useState<FeedbackState>({});

    const showToast = (msg: string, type: ToastType) => {
        setToast({ msg, type, visible: true });
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const res = await apiFetch('/my-teachers/');
            const data = await res.json();

            if (data.status === "ok") {
                const flatTeachers: Teacher[] = [];
                data.subjects.forEach((subj: Subject) => {
                    subj.teachers.forEach(t => {
                        flatTeachers.push({
                            ...t,
                            subject_code: subj.subject_code,
                            subject_name: subj.subject_name
                        });
                    });
                });
                setAllTeachers(flatTeachers);

                // Initialize feedback state for unsubmitted teachers
                const initialFeedback: FeedbackState = {};
                flatTeachers.forEach(t => {
                    if (!t.is_submitted) {
                        initialFeedback[t.allocation_id] = {
                            ratings: {
                                q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
                                q6: 0, q7: 0, q8: 0, q9: 0, q10: 0
                            },
                            comments: ""
                        };
                    }
                });
                setFeedbacks(initialFeedback);
            } else {
                showToast("Session expired or invalid. Please login again.", "error");
                router.push('/');
            }
        } catch (error) {
            console.error("Fetch teachers error:", error);
            showToast("Error connecting to server. Is backend running?", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (allocationId: number, qKey: string, rating: number) => {
        setFeedbacks(prev => ({
            ...prev,
            [allocationId]: {
                ...prev[allocationId],
                ratings: {
                    ...prev[allocationId].ratings,
                    [qKey]: rating
                }
            }
        }));
    };

    const handleCommentChange = (allocationId: number, comments: string) => {
        setFeedbacks(prev => ({
            ...prev,
            [allocationId]: {
                ...prev[allocationId],
                comments
            }
        }));
    };

    const getProgress = (allocationId: number) => {
        const f = feedbacks[allocationId];
        if (!f) return 0;
        return Object.values(f.ratings).filter(val => val > 0).length;
    };

    const handleSubmitAll = async () => {
        const pendingTeachers = allTeachers.filter(t => !t.is_submitted);
        const incomplete = pendingTeachers.some(t => getProgress(t.allocation_id) < 10);

        if (incomplete) {
            showToast("Please provide all ratings for each teacher before submitting.", "error");
            return;
        }

        setSubmitting(true);
        let successCount = 0;
        let failCount = 0;

        for (const t of pendingTeachers) {
            const payload = {
                subject_code: t.subject_code,
                allocation_id: t.allocation_id,
                ...feedbacks[t.allocation_id].ratings,
                comments: feedbacks[t.allocation_id].comments
            };

            try {
                const res = await apiFetch('/submit-feedback/', {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.status === "ok") {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
        }

        setSubmitting(false);
        if (failCount === 0) {
            showToast(`All ${successCount} feedbacks submitted successfully!`, "success");
            fetchTeachers();
        } else {
            showToast(`${successCount} submitted, ${failCount} failed. Please try again.`, "error");
        }
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

    const pendingTeachers = allTeachers.filter(t => !t.is_submitted);

    return (
        <div className="min-h-screen pb-24">
            <Toast
                message={toast.msg}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <div className="text-center space-y-4 mb-12">
                <h2 className="text-5xl font-black text-blue-600 tracking-tight">Rate Your Teachers</h2>
                <p className="text-gray-500 font-medium text-lg">Provide your valuable feedback using the quick rating form below.</p>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
                {pendingTeachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xl text-center">
                        <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">All Feedback Submitted</h3>
                        <p className="text-gray-500 max-w-md">
                            Thank you! You have successfully provided feedback for all your teachers this semester.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {pendingTeachers.map((teacher, idx) => (
                            <motion.div
                                key={teacher.allocation_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[32px] overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100"
                            >
                                {/* Card Header */}
                                <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-bold text-2xl text-blue-600 shadow-sm">
                                            {teacher.teacher_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900">{teacher.teacher_name}</h3>
                                                <span className="px-2 py-0.5 bg-gray-200/50 text-gray-500 rounded text-xs font-bold uppercase tracking-wider">{teacher.subject_code}</span>
                                            </div>
                                            <p className="text-blue-600 font-semibold">{teacher.subject_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                                {getProgress(teacher.allocation_id)}/10 COMPLETED
                                            </span>
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-blue-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(getProgress(teacher.allocation_id) / 10) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating Grid */}
                                <div className="p-10 pb-0 grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
                                    {QUESTION_LABELS.map((q) => (
                                        <div key={q.key} className="flex items-center justify-between">
                                            <span className="text-gray-500 font-bold text-sm tracking-wide">{q.label}</span>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                    const currentVal = feedbacks[teacher.allocation_id]?.ratings[q.key] || 0;
                                                    return (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => handleRatingChange(teacher.allocation_id, q.key, star)}
                                                            className={cn(
                                                                "p-0.5 transition-all focus:outline-none",
                                                                currentVal >= star
                                                                    ? "text-yellow-400 scale-110"
                                                                    : "text-gray-100 hover:text-gray-200"
                                                            )}
                                                        >
                                                            <Star
                                                                size={24}
                                                                fill={currentVal >= star ? "currentColor" : "none"}
                                                                strokeWidth={currentVal >= star ? 0 : 2}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Card Comments */}
                                <div className="p-10 pt-8">
                                    <div className="p-6 bg-slate-50/50 rounded-2xl border border-gray-50 space-y-3">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Quick Note</label>
                                            <span className={cn(
                                                "text-[10px] font-bold tracking-tighter transition-colors",
                                                (feedbacks[teacher.allocation_id]?.comments.length || 0) >= 20 ? "text-red-500" : "text-gray-400"
                                            )}>
                                                {feedbacks[teacher.allocation_id]?.comments.length || 0}/20
                                            </span>
                                        </div>
                                        <div className="relative group/input">
                                            <textarea
                                                value={feedbacks[teacher.allocation_id]?.comments || ""}
                                                onChange={(e) => handleCommentChange(teacher.allocation_id, e.target.value)}
                                                maxLength={20}
                                                placeholder={`What's one thing about ${teacher.teacher_name.split(' ')[0]}?`}
                                                className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none shadow-sm placeholder:text-gray-300 font-medium"
                                                rows={1}
                                            />
                                            <div className="absolute bottom-3 right-3 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Floating Bar */}
            <AnimatePresence>
                {pendingTeachers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4"
                    >
                        <button
                            onClick={handleSubmitAll}
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] flex items-center gap-3 transition-all active:scale-95 group"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Submitting Data...
                                </>
                            ) : (
                                <>
                                    Submit All Feedback
                                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
