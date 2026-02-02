"use client"
import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, Send } from 'lucide-react';
import API_BASE_URL from '@/config';
import { Button } from '@/components/ui/Button';
import { Toast, ToastType } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

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

    const questions = [
        "How would you rate the teacher's subject knowledge?",
        "How clear and organized are the lectures?",
        "Does the teacher encourage student participation?",
        "How effectively does the teacher use teaching aids?",
        "How approachable is the teacher for doubts?",
        "How well does the teacher manage classroom discipline?",
        "How relevant are the examples provided in class?",
        "How timely is the feedback on assignments?",
        "How well does the teacher prepare for classes?",
        "Overall, how satisfied are you with this teacher?"
    ];

    const showToast = (msg: string, type: ToastType) => {
        setToast({ msg, type, visible: true });
    };

    const handleRatingChange = (qIndex: number, rating: number) => {
        setFeedback(prev => ({
            ...prev,
            [`q${qIndex}`]: rating
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const allRated = questions.every((_, i) => (feedback[`q${i + 1}`] as number) > 0);
        if (!allRated) {
            showToast("Please rate all questions before submitting.", "error");
            return;
        }

        setLoading(true);

        const feedbackData = {
            subject_code: subjectCode,
            allocation_id: parseInt(allocationId),
            ...feedback
        };

        try {
            const res = await fetch(`${API_BASE_URL}/submit-feedback/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
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
        <div className="max-w-4xl mx-auto space-y-8">
            <Toast
                message={toast.msg}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Feedback for {teacherName}</h1>
                    <p className="text-gray-500 text-sm">Subject: <span className="font-medium text-gray-700">{subjectCode}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
                <div className="space-y-6">
                    {questions.map((q, index) => {
                        const qNum = index + 1;
                        const currentRating = feedback[`q${qNum}`] as number;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="space-y-3 pb-6 border-b border-gray-50 last:border-0"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">
                                        {qNum}
                                    </span>
                                    <p className="flex-1 text-gray-700 font-medium leading-relaxed">{q}</p>
                                </div>
                                <div className="flex items-center gap-2 pl-10">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleRatingChange(qNum, star)}
                                            className={cn(
                                                "p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-200",
                                                currentRating >= star
                                                    ? "text-yellow-400 transform scale-110"
                                                    : "text-gray-200 hover:text-gray-300"
                                            )}
                                            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        >
                                            <Star size={28} fill={currentRating >= star ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                    <span className="ml-3 text-sm font-medium text-gray-400 min-w-[60px]">
                                        {currentRating > 0 ? (
                                            currentRating === 1 ? 'Poor' :
                                                currentRating === 2 ? 'Fair' :
                                                    currentRating === 3 ? 'Good' :
                                                        currentRating === 4 ? 'Very Good' : 'Excellent'
                                        ) : 'Select'}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="pt-4 space-y-3">
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                        Additional Comments (Optional)
                    </label>
                    <textarea
                        id="comments"
                        rows={4}
                        className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        placeholder="Share any other thoughts..."
                        value={feedback.comments as string}
                        onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full md:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        isLoading={loading}
                    >
                        Submit Feedback
                        <Send size={16} />
                    </Button>
                </div>
            </form>
        </div>
    );
}
