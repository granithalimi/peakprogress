"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-slate-200/80 bg-white shadow-lg shadow-slate-100/80 rounded-2xl">
        <CardHeader className="space-y-1.5 pb-6 pt-8 text-center sm:text-left">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 group transition-opacity hover:opacity-85"
              aria-label="Go to Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm shadow-sky-500/30 group-hover:scale-105 transition-transform">
                {/* Gym / Dumbbell icon */}
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
              <span className="text-sm font-bold tracking-tight text-slate-900">
                Peak<span className="text-sky-500">Progress</span>
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-600 border border-sky-100">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
              Tracker
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Enter your email and password to access your workouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm transition-all active:scale-[0.99] disabled:opacity-70 mt-2 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="pt-2 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-slate-900 hover:text-sky-600 transition-colors underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
