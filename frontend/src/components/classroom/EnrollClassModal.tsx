'use client';

import React, { useState } from 'react';
import { private_api_call } from "@/actions/private_api_call";

// FloatingField remains identical to your CreateClassroom
interface FloatingFieldProps {
    label: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    autoFocus?: boolean;
    disabled?: boolean;
}

function FloatingField({ label, required, value, onChange, autoFocus, disabled }: FloatingFieldProps) {
    const [focused, setFocused] = useState(false);
    const filled = value.length > 0;
    const active = focused || filled;

    return (
        <div className="relative">
            <div className={`relative bg-bg-main rounded-t-md border-b-2 transition-colors ${focused ? 'border-brand-primary' : 'border-surface-border'}`}>
                <label className={`absolute left-4 transition-all pointer-events-none ${active ? 'top-1.5 text-[11px]' : 'top-1/2 -translate-y-1/2 text-base'} ${focused ? 'text-brand-primary' : 'text-text-main'}`}>
                    {label}
                    {required && <span className="text-brand-primary">*</span>}
                </label>
                <input
                    autoFocus={autoFocus}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="w-full bg-transparent outline-none pt-6 pb-2 px-4 text-base text-text-main disabled:opacity-60"
                />
            </div>
        </div>
    );
}

interface EnrollClassroomProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EnrollClassroom({ open, onOpenChange, onSuccess }: EnrollClassroomProps) {
    const [join_code, setJoinCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const handleClose = () => {
        if (isSubmitting) return;
        setJoinCode('');
        setError(null);
        onOpenChange(false);
    };

    const handleEnroll = async () => {
        if (!join_code.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Pointing to your enrollment endpoint
            await private_api_call({
                path: "enrollments/join",
                method: "POST",
                body: { join_code }
            });
            setJoinCode('');
            onOpenChange(false);
            onSuccess();
        } catch (err) {
            setError('Could not join class. Please check the code and try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            {/* Added same border-brand-primary as CreateClassroom */}
            <div className="bg-bg-main rounded-2xl w-full max-w-sm shadow-2xl px-7 pt-7 pb-5 border-2 border-brand-primary">
                <h2 className="text-2xl text-text-main mb-6">Join class</h2>

                <div className="space-y-5">
                    <FloatingField
                        label="Class code"
                        required
                        value={join_code}
                        onChange={setJoinCode}
                        autoFocus
                        disabled={isSubmitting}
                    />
                </div>

                <p className="text-xs text-text-main mt-4 text-opacity-60">
                    Ask your teacher for the class code, then enter it here.
                </p>

                {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

                <div className="flex justify-end items-center gap-6 mt-8">
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-brand-primary font-medium text-sm px-2 py-2 rounded hover:bg-brand-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    {/* Styled button to match CreateClassroom exactly */}
                    <button
                        disabled={!join_code.trim() || isSubmitting}
                        onClick={handleEnroll}
                        className="font-medium text-sm px-4 py-2 rounded transition-colors disabled:text-slate-400 disabled:cursor-not-allowed enabled:text-blue-700 enabled:hover:bg-blue-50"
                    >
                        {isSubmitting ? 'Joining…' : 'Join'}
                    </button>
                </div>
            </div>
        </div>
    );
}