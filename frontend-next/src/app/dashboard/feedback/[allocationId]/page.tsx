"use client"
import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import API_BASE_URL from '@/config';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Toast, ToastType } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

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

export default function FeedbackPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    // Get params
    const allocationId = params.allocationId as string;
    const teacherName = searchParams.get('teacherName') || 'Teacher';
    const subjectCode = searchParams.get('subjectCode') || 'Subject';

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: ToastType; visible: boolean }>({
        msg: '',
        type: 'info',
        visible: false,
    });

    const [feedback, setFeedback] = useState<Record<string, number | string>>({
        q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
        q6: 0, q7: 0, q8: 0, q9: 0, q10: 0,
        comments: ''
    });

    const showToast = (msg: string, type: ToastType) => {
        setToast({ msg, type, visible: true });
    };

    const handleRatingChange = (qKey: string, rating: number) => {
        setFeedback(prev => ({
            ...prev,
            [qKey]: rating
        }));
    };

    const getProgress = () => {
        return Object.keys(feedback).filter(key => key.startsWith('q') && (feedback[key] as number) > 0).length;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const allRated = getProgress() === 10;
        if (!allRated) {
            showToast("Please rate all categories before submitting.", "error");
            return;
        }

        setLoading(true);

        const feedbackData = {
            subject_code: subjectCode,
            allocation_id: parseInt(allocationId),
            ...feedback
        };

        try {
            const res = await apiFetch('/submit-feedback/', {
                method: "POST",
                body: JSON.stringify(feedbackData)
            });

            const data = await res.json();

            if (data.status === "ok") {
                showToast("Feedback submitted successfully!", "success");
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                if (data.error === "feedback already submitted") {
                    showToast("You have already submitted feedback for this teacher.", "error");
                } else {
                    showToast(data.error || "Submission failed.", "error");
                }
            }
        } catch (error) {
            console.error("Submit error:", error);
            showToast("Error connecting to server.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <Toast
                message={toast.msg}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-blue-600 border border-gray-100 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Teacher Feedback</h1>
                    <p className="text-gray-500 font-medium">Provide your constructive feedback for {teacherName}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-bold text-2xl text-blue-600 shadow-sm">
                            {teacherName.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-900">{teacherName}</h3>
                                <span className="px-2 py-0.5 bg-gray-200/50 text-gray-500 rounded text-xs font-bold uppercase tracking-wider">{subjectCode}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                {getProgress()}/10 COMPLETED
                            </span>
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(getProgress() / 10) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
                    {QUESTION_LABELS.map((q) => (
                        <div key={q.key} className="flex items-center justify-between">
                            <span className="text-gray-500 font-bold text-sm tracking-wide">{q.label}</span>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const currentVal = feedback[q.key] as number;
                                    return (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleRatingChange(q.key, star)}
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

                <div className="p-10 bg-slate-50/30 border-t border-gray-50 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="comments" className="text-[10px] font-black text-gray-400 tracking-widest uppercase ml-1">
                            Quick Note
                        </label>
                        <span className={cn(
                            "text-[10px] font-bold tracking-tighter transition-colors",
                            (feedback.comments as string).length >= 20 ? "text-red-500" : "text-gray-400"
                        )}>
                            {(feedback.comments as string).length}/20
                        </span>
                    </div>
                    <textarea
                        id="comments"
                        rows={2}
                        maxLength={20}
                        className="w-full p-4 rounded-2xl border border-gray-100 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none shadow-sm placeholder:text-gray-300 font-medium"
                        placeholder={`What's one thing about your experience?`}
                        value={feedback.comments as string}
                        onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                    />
                </div>

                <div className="p-10 flex justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full md:w-auto px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white gap-3 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 group"
                        isLoading={loading}
                    >
                        Submit Feedback
                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
