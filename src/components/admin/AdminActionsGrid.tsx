import Link from 'next/link';
import {
    Users,
    ArrowLeftRight,
    TrendingUp,
    FileCheck,
    Receipt,
    Settings,
    Mail,
    LayoutDashboard,
    CreditCard,
    Landmark,
    ArrowDownToLine,
    ArrowUpFromLine,
    Globe,
    UserPlus,
    MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui';

// Mapped from Sidebar.tsx structure but flattened for the dashboard grid
const adminActions = [
    { label: 'Manage Users', href: '/admin/users', icon: Users, color: 'blue' },
    { label: 'Pending Regs', href: '/admin/registrations', icon: UserPlus, color: 'yellow' },
    { label: 'Deposits', href: '/admin/deposits', icon: ArrowDownToLine, color: 'green' },
    { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUpFromLine, color: 'red' },
    { label: 'Transfers', href: '/admin/transfers', icon: ArrowLeftRight, color: 'indigo' },
    { label: 'Virtual Cards', href: '/admin/cards', icon: CreditCard, color: 'purple' },
    { label: 'Loan Requests', href: '/admin/loans', icon: Landmark, color: 'amber' },
    { label: 'KYC Applications', href: '/admin/kyc', icon: FileCheck, color: 'orange' },
    { label: 'IRS Refunds', href: '/admin/irs-refunds', icon: Receipt, color: 'emerald' },
    { label: 'Email System', href: '/admin/email', icon: Mail, color: 'pink' },
    { label: 'Support Tickets', href: '/admin/support', icon: MessageSquare, color: 'cyan' }, // Added Support Tickets
    { label: 'App Settings', href: '/admin/settings/app', icon: Settings, color: 'gray' },
];

export function AdminActionsGrid() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {adminActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                        <Card className="hover:border-[var(--primary)] transition-all cursor-pointer h-full border-[var(--border)] bg-[var(--surface)]">
                            <div className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <div className={`p-2 rounded-full bg-${action.color}-500/10 text-${action.color}-500`}>
                                    {/* Note: In a real app we might need dynamic color mapping or utility classes. 
                      For now, utilizing the text-primary/secondary pattern or specific colors if available.
                      Falling back to simplified styling if safe list isn't set up.
                   */}
                                    <action.icon className="w-6 h-6" style={{ color: `var(--${action.color}-500, var(--primary))` }} />
                                </div>
                                <span className="text-xs font-medium text-[var(--text-secondary)]">{action.label}</span>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
