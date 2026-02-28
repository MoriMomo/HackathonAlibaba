"use client";

export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQunci } from '@/context/QunciContext';
import { CheckCircle2, Loader2 } from 'lucide-react';

function TopUpSuccessContent() {
    const router = useRouter();
    const context = useQunci();

    // Guard against null context during SSR
    if (!context) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
                <Loader2 className="text-blue-500 animate-spin mx-auto" size={32} />
                <p className="text-slate-500 text-sm">Loading...</p>
            </div>
        );
    }

    const { topUpUser, showToast } = context;

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
    );
}

export default function TopUpSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Suspense fallback={<Loader2 className="text-blue-500 animate-spin" size={32} />}>
                <TopUpSuccessContent />
            </Suspense>
        </div>
    );
}
