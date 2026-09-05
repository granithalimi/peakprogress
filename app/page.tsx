import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { DashboardView } from "@/components/dashboard-view";
import {
  DashboardMetrics,
  WeeklyProgressDay,
  workout_log_entries,
  plan_days,
} from "@/lib/types";
import { redirect } from "next/navigation";

function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Fetch active workout plan with days and exercises
  const { data: activePlans } = await supabase
    .from("workout_plans")
    .select("*, plan_days(*, plan_exercises(*))")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const activePlan = activePlans && activePlans.length > 0 ? activePlans[0] : null;

  // 2. Fetch workout logs for user
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("*, workout_log_entries(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const workoutLogs = logs || [];

  // Calculate current week boundaries
  const now = new Date();
  const todayDayOfWeek = (now.getDay() + 6) % 7; // Convert 0(Sun)->6, 1(Mon)->0, etc.
  const startOfWeek = getStartOfWeek(now);
  const weekStartStr = startOfWeek.toISOString().split("T")[0];

  // Current week's logs
  const thisWeekLogs = workoutLogs.filter((log) => {
    return log.week_start_date === weekStartStr && log.completed;
  });

  // Calculate Metrics
  const totalWorkouts = workoutLogs.filter((l) => l.completed).length;

  // Calculate Total Volume from top sets across logs
  let totalVolume = 0;
  workoutLogs.forEach((log) => {
    if (log.workout_log_entries) {
      log.workout_log_entries.forEach((entry: workout_log_entries) => {
        const weight = Number(entry.top_weight) || 0;
        const reps = Number(entry.top_reps) || 0;
        totalVolume += weight * reps;
      });
    }
  });

  // Calculate Weekly completion rate based on planned non-rest days
  const plannedWorkoutDays =
    activePlan?.plan_days?.filter((d: plan_days) => !d.is_rest).length || 5;
  const completedThisWeekCount = thisWeekLogs.length;
  const weeklyCompletionRate = Math.min(
    100,
    Math.round((completedThisWeekCount / (plannedWorkoutDays || 1)) * 100)
  );

  // Calculate Streak (consecutive weeks with at least 1 completed workout)
  let currentStreak = 0;
  if (completedThisWeekCount > 0) {
    currentStreak = 1;
  }

  // 7-day tracker status (Monday through Sunday)
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weeklyDays: WeeklyProgressDay[] = dayNames.map((name, index) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(dayDate.getDate() + index);
    const isToday = index === todayDayOfWeek;
    const isCompleted = thisWeekLogs.some((log) => log.day_of_week === index);
    const planDay = activePlan?.plan_days?.find((d: plan_days) => d.day_of_week === index);
    const isRest = planDay?.is_rest ?? false;

    return {
      dayName: name,
      dayOfWeek: index,
      dateStr: dayDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      isCompleted,
      isToday,
      isRest,
    };
  });

  const metrics: DashboardMetrics = {
    totalWorkouts,
    currentStreak,
    weeklyCompletionRate,
    totalVolume,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <AppHeader userEmail={user.email} />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8">
        <DashboardView
          userEmail={user.email || ""}
          activePlan={activePlan}
          recentLogs={workoutLogs.slice(0, 5)}
          metrics={metrics}
          weeklyDays={weeklyDays}
          todayDayOfWeek={todayDayOfWeek}
        />
      </main>
    </div>
  );
}
