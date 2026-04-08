import { ShieldCheck, Lock, Smartphone } from 'lucide-react';
import Link from 'next/link';

export function SecurityCard() {
    const lastLogin = new Date();

    return (
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Security Center</h3>
                <ShieldCheck className="h-5 w-5 text-green-400" />
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Lock className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                        <p className="text-base font-medium text-white">Account Protected</p>
                        <p className="text-sm text-green-400/80 mt-0.5">256-bit Encryption active</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-base font-medium text-white">Device Verified</p>
                        <p className="text-sm text-gray-400 mt-0.5">Last login: {lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>

                <div className="pt-2">
                    <Link
                        href="/dashboard/profile"
                        className="block w-full py-2 px-4 bg-gray-700/50 hover:bg-gray-700 text-center text-sm text-blue-300 rounded-lg transition-colors"
                    >
                        Manage Security Settings
                    </Link>
                </div>
            </div>
        </div>
    );
}
