import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { TrackManager } from "@/components/track-manager";
import { getStartOfWeek, formatDateToISO } from "@/lib/date-utils";
import { redirect } from "next/navigation";
import { plan_days } from "@/lib/types";

interface TrackPageProps {
  searchParams: Promise<{
    week?: string;
    day?: string;
  }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const resolvedParams = await searchParams;

  // Compute current week and today
  const now = new Date();
  const currentWeekStart = formatDateToISO(getStartOfWeek(now));
  const todayDayOfWeek = (now.getDay() + 6) % 7; // Mon=0, Sun=6

  // Use URL search params if present, otherwise fallback to current week and today
  const selectedWeek = resolvedParams.week || currentWeekStart;
  const selectedDay =
    resolvedParams.day !== undefined && !isNaN(Number(resolvedParams.day))
      ? Math.max(0, Math.min(6, parseInt(resolvedParams.day, 10)))
      : todayDayOfWeek;

  // 1. Fetch active workout plan with all days and planned exercises
  const { data: plans } = await supabase
    .from("workout_plans")
    .select("*, plan_days(*, plan_exercises(*))")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const activePlan = plans && plans.length > 0 ? plans[0] : null;

  // Sort plan_exercises by order_index for every day
  if (activePlan?.plan_days) {
    activePlan.plan_days.forEach((day: any) => {
      if (day.plan_exercises) {
        day.plan_exercises.sort(
          (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
        );
      }
    });
  }

  // 2. Fetch workout logs for the selected week to display badges and session data
  const { data: weekLogs } = await supabase
    .from("workout_logs")
    .select("*, workout_log_entries(*)")
    .eq("user_id", user.id)
    .eq("week_start_date", selectedWeek);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <AppHeader userEmail={user.email} />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8">
        <TrackManager
          initialWeekStartDate={selectedWeek}
          currentWeekStartDate={currentWeekStart}
          initialDayOfWeek={selectedDay}
          activePlan={activePlan}
          initialLogs={weekLogs || []}
        />
      </main>
    </div>
  );
}
