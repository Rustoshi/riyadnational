'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Landmark, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Services',
    children: [
      { label: 'Savings Account', href: '/services/savings' },
      { label: 'Checking Account', href: '/services/checking' },
      { label: 'Credit Cards', href: '/services/cards' },
      { label: 'Loans', href: '/services/loans' },
    ],
  },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isScrolled ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <Landmark className={`w-6 h-6 ${isScrolled ? 'text-white' : 'text-white'}`} />
            </div>
            <span className={`text-xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              {companyName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                {link.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                        isScrolled
                          ? 'text-gray-700 hover:text-blue-600'
                          : 'text-white/90 hover:text-white'
                      }`}
                    >
                      {link.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {openDropdown === link.label && (
                      <div className="absolute top-full left-0 pt-2">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] animate-fadeIn">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isScrolled
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-300 ${
                isScrolled
                  ? 'text-[var(--public-text-secondary)] hover:bg-[var(--public-primary-soft)] hover:text-[var(--public-primary)]'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors duration-200 ${
                isScrolled
                  ? 'text-[var(--public-text-secondary)] hover:text-[var(--public-primary)]'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                isScrolled
                  ? 'bg-[var(--public-primary)] text-white hover:shadow-lg hover:shadow-[var(--public-primary)]/30'
                  : 'bg-white text-[var(--public-primary)] hover:bg-[var(--public-primary-soft)]'
              }`}
            >
              Open Account
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white rounded-2xl shadow-xl mt-2 p-4 animate-fadeIn">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.children ? (
                  <div className="py-2">
                    <span className="text-sm font-semibold text-gray-900">{link.label}</span>
                    <div className="mt-2 ml-4 space-y-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className="block py-3 text-sm font-medium text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-[var(--public-border)] space-y-3">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-[var(--public-text-secondary)] hover:text-[var(--public-primary)] transition-colors"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              <Link
                href="/login"
                className="block w-full py-3 text-center text-sm font-medium text-[var(--public-text-secondary)] hover:text-[var(--public-primary)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block w-full py-3 text-center text-sm font-semibold bg-[var(--public-primary)] text-white rounded-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Open Account
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
