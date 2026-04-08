'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  TrendingUp,
  FileCheck,
  Landmark,
  Settings,
  Mail,
  ChevronDown,
  ChevronRight,
  Receipt,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Registrations', href: '/admin/registrations', icon: UserPlus },
  {
    label: 'Transactions',
    icon: ArrowLeftRight,
    children: [
      { label: 'Deposits', href: '/admin/deposits' },
      { label: 'Withdrawals', href: '/admin/withdrawals' },
      { label: 'Transfers', href: '/admin/transfers' },
    ],
  },
  {
    label: 'Products',
    icon: TrendingUp,
    children: [
      { label: 'Virtual Cards', href: '/admin/cards' },
      { label: 'Loans', href: '/admin/loans' },
    ],
  },
  { label: 'KYC Applications', href: '/admin/kyc', icon: FileCheck },
  { label: 'IRS Refunds', href: '/admin/irs-refunds', icon: Receipt },
  { label: 'Support Tickets', href: '/admin/support', icon: MessageSquare },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'App Settings', href: '/admin/settings/app' },
      { label: 'Payment Settings', href: '/admin/settings/payment' },
    ],
  },
  { label: 'Email', href: '/admin/email', icon: Mail },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isChildActive = (children?: { href: string }[]) =>
    children?.some((child) => pathname === child.href);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-60
          bg-[var(--surface)] border-r border-[var(--border)]
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--border)]">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary)] flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-[var(--text-primary)]">Admin Panel</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 overflow-y-auto h-[calc(100%-4rem)]">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  // Expandable item
                  <div>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2.5
                        text-sm font-medium rounded-[var(--radius-md)]
                        transition-colors duration-150
                        ${isChildActive(item.children)
                          ? 'text-[var(--primary)] bg-[var(--primary-light)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </div>
                      {expandedItems.includes(item.label) || isChildActive(item.children) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {(expandedItems.includes(item.label) || isChildActive(item.children)) && (
                      <ul className="mt-1 ml-5 pl-3 border-l border-[var(--border)] space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`
                                block px-3 py-2 text-sm rounded-[var(--radius-md)]
                                transition-colors duration-150
                                ${isActive(child.href)
                                  ? 'text-[var(--primary)] bg-[var(--primary-light)] font-medium'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]'
                                }
                              `}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Single item
                  <Link
                    href={item.href!}
                    className={`
                      flex items-center gap-3 px-3 py-2.5
                      text-sm font-medium rounded-[var(--radius-md)]
                      transition-colors duration-150
                      ${isActive(item.href!)
                        ? 'text-[var(--primary)] bg-[var(--primary-light)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
