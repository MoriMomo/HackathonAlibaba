"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQunci } from '@/context/QunciContext';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function TopUpSuccessPage() {
    const router = useRouter();
    const { topUpUser, showToast } = useQunci();

    // In a real app, you would securely verify a server-side Webhook from PayLabs here.
    // For this SIT / Sandbox integration, we will simulate a successful payment locally.

    useEffect(() => {
        // Wait for a brief moment to simulate processing
        const timer = setTimeout(() => {
            // Top up with out dummy 500,000 amount
            topUpUser(500000);
            showToast("PayLabs Top Up Successful!", "success");

            // Redirect back to the User Dashboard
            router.push('/');
        }, 2000);

        return () => clearTimeout(timer);
    }, [topUpUser, showToast, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="relative">
                        <CheckCircle2 size={64} className="text-emerald-500 relative z-10" />
                        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-40 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Verified</h1>
                <p className="text-slate-500 text-sm">
                    PayLabs has confirmed your Rp 500.000 top up. We are syncing this to your Qunci app...
                </p>

                <div className="pt-6 flex justify-center">
                    <Loader2 className="text-blue-500 animate-spin" size={24} />
                </div>
            </div>
        </div>
    );
}
