"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  LogOut,
  User as UserIcon,
} from "lucide-react";

interface AppHeaderProps {
  userEmail?: string | null;
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/plan", label: "Plan", icon: CalendarDays },
    { href: "/track", label: "Track", icon: Dumbbell },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm shadow-sky-500/30 group-hover:scale-105 transition-transform">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m6.5 6.5 11 11" />
              <path d="m21 21-1-1" />
              <path d="m3 3 1 1" />
              <path d="m18 22 4-4" />
              <path d="m2 6 4-4" />
              <path d="m3 10 7-7" />
              <path d="m14 21 7-7" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Peak<span className="text-sky-500">Progress</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 border border-slate-200/50">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-sky-500" : "text-slate-500"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Account / Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {userEmail && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-600">
              <UserIcon className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-[140px] truncate">{userEmail}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-9 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 mr-1 text-slate-400 group-hover:text-red-500" />
            {isLoggingOut ? "..." : "Sign Out"}
          </Button>
        </div>
      </div>

      {/* Mobile Sticky Navigation Tabs */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around bg-slate-50/50">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                isActive
                  ? "text-sky-600 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isActive ? "bg-sky-100/80 text-sky-600" : "text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
