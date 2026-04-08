'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
    ShieldCheck,
    Clock,
    CheckCircle2,
    ArrowRight,
    Landmark,
    Mail,
} from 'lucide-react';

export default function PendingApprovalPage() {
    const { settings } = useSiteSettings();
    const companyName = settings.siteName;

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Animated Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

            {/* Content Card */}
            <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden relative z-10">
                <div className="p-8 sm:p-12 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-20" />
                        <ShieldCheck className="w-10 h-10 text-green-500" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2" style={{ color: 'white' }}>
                        Application Received
                    </h1>
                    <p className="text-blue-400 font-medium mb-6">
                        Account Status: <span className="text-yellow-400">Pending Review</span>
                    </p>

                    <p className="text-slate-300 text-base leading-relaxed mb-8">
                        Thank you for choosing {companyName}. Your account Application has been successfully submitted and is currently under review by our compliance team.
                    </p>

                    {/* Steps */}
                    <div className="bg-slate-900/50 rounded-xl p-6 text-left space-y-4 mb-8">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-white text-sm font-semibold" style={{ color: 'white' }}>Application Submitted</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Your details have been received securely.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-white text-sm font-semibold" style={{ color: 'white' }}>Under Review</h3>
                                <p className="text-slate-400 text-xs mt-0.5">We are verifying your information.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-300 text-sm font-semibold">Email Notification</h3>
                                <p className="text-slate-500 text-xs mt-0.5">You'll receive an email once approved.</p>
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="space-y-4">
                        <Link href="/" className="block w-full">
                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group">
                                Return to Home
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>

                        <p className="text-slate-500 text-sm">
                            Questions? <a href="/contact" className="text-blue-400 hover:underline">Contact Support</a>
                        </p>
                    </div>
                </div>

                {/* Footer info using Company Name */}
                <div className="bg-slate-900/50 py-4 px-8 text-center border-t border-slate-700">
                    <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
                        <Landmark className="w-3 h-3" />
                        {companyName} Secure Banking
                    </p>
                </div>
            </div>
        </div>
    );
}
