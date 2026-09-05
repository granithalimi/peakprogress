"use client";

import Link from "next/link";
import {
  WorkoutPlan,
  PlanDay,
  WorkoutLog,
  WorkoutLogEntry,
  DashboardMetrics,
  WeeklyProgressDay,
} from "@/lib/types";
import {
  Flame,
  Trophy,
  Activity,
  Weight,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardViewProps {
  userEmail: string;
  activePlan: (WorkoutPlan & { plan_days: (PlanDay & { plan_exercises: any[] })[] }) | null;
  recentLogs: (WorkoutLog & { workout_log_entries: WorkoutLogEntry[] })[];
  metrics: DashboardMetrics;
  weeklyDays: WeeklyProgressDay[];
  todayDayOfWeek: number;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function DashboardView({
  userEmail,
  activePlan,
  recentLogs,
  metrics,
  weeklyDays,
  todayDayOfWeek,
}: DashboardViewProps) {
  const todayPlanDay = activePlan?.plan_days?.find((d) => d.day_of_week === todayDayOfWeek);
  const isTodayRest = todayPlanDay?.is_rest ?? false;
  const todayExercisesCount = todayPlanDay?.plan_exercises?.length ?? 0;
  const isTodayCompleted = weeklyDays.find((d) => d.isToday)?.isCompleted ?? false;

  const completedCount = weeklyDays.filter((d) => d.isCompleted).length;
  const plannedWorkoutDays = activePlan?.plan_days?.filter((d) => !d.is_rest).length || 5;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100">
            <Sparkles className="h-3 w-3" />
            <span>Lightweight Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Progress Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Stay consistent, push your top sets, and hit your weekly goals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <Button
            asChild
            className="h-11 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm transition-all active:scale-[0.99]"
          >
            <Link href="/track" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Track Today</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
          >
            <Link href="/plan" className="flex items-center gap-2">
              <span>{activePlan ? "Edit Plan" : "Create Plan"}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Workouts */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Workouts
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {metrics.totalWorkouts}
              </div>
              <p className="text-[11px] text-slate-500">Lifetime completed</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Current Streak */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Streak
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {metrics.currentStreak} <span className="text-sm font-normal text-slate-500">weeks</span>
              </div>
              <p className="text-[11px] text-slate-500">Active consistency</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Weekly Rate */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                This Week
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {metrics.weeklyCompletionRate}%
              </div>
              <p className="text-[11px] text-slate-500">{completedCount} of {plannedWorkoutDays} sessions done</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Total Volume */}
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Volume
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Weight className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {metrics.totalVolume.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
              </div>
              <p className="text-[11px] text-slate-500">Logged top set load</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Tracker Visualizer */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-900">
              Weekly Routine Progress
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-500">
              Mon — Sun active session completion
            </CardDescription>
          </div>
          <div className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
            {completedCount}/{weeklyDays.length} Days Completed
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {weeklyDays.map((day) => {
              const isToday = day.isToday;
              const isCompleted = day.isCompleted;
              const isRest = day.isRest;

              return (
                <div
                  key={day.dayOfWeek}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl border transition-all ${
                    isToday
                      ? "border-sky-500 bg-sky-50/50 shadow-sm ring-2 ring-sky-500/20"
                      : isCompleted
                      ? "border-emerald-200 bg-emerald-50/30 text-emerald-900"
                      : isRest
                      ? "border-slate-200/60 bg-slate-50/50 text-slate-400"
                      : "border-slate-200/80 bg-white text-slate-600"
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                    {day.dayName.slice(0, 3)}
                  </span>
                  
                  <div className="my-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full">
                    {isCompleted ? (
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : isRest ? (
                      <span className="text-[11px] font-medium text-slate-400">Rest</span>
                    ) : (
                      <div className={`h-2.5 w-2.5 rounded-full ${isToday ? "bg-sky-500 animate-pulse" : "bg-slate-200"}`} />
                    )}
                  </div>

                  <span className="text-[10px] font-medium text-slate-500">
                    {isToday ? "Today" : isCompleted ? "Done" : isRest ? "Off" : "Planned"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Today's status highlight */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-sky-600 shadow-xs">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Today ({DAY_NAMES[todayDayOfWeek]})
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {isTodayCompleted
                    ? "Workout completed for today! Great job!"
                    : isTodayRest
                    ? "Rest & Recovery Day. Take time to regenerate."
                    : activePlan
                    ? `Planned session: ${todayExercisesCount} exercises scheduled`
                    : "No routine configured yet."}
                </p>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="h-9 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs"
            >
              <Link href="/track">
                {isTodayCompleted ? "View Log" : "Log Today"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workouts Log (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Recent Workout Sessions
            </h2>
            <Link
              href="/track"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>View all logs</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const dayName = DAY_NAMES[log.day_of_week] || "Workout";
                const totalExercises = log.workout_log_entries?.length || 0;
                const topSets = log.workout_log_entries?.filter(
                  (e) => (e.top_weight || 0) > 0 || (e.top_reps || 0) > 0
                ) || [];

                return (
                  <Card
                    key={log.id}
                    className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:border-slate-300 transition-all"
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                          <CheckCircle2 className="h-5 w-5 text-sky-500" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {dayName} Session
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(log.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          {topSets.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {topSets.slice(0, 3).map((entry, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700"
                                >
                                  {entry.exercise_name}: {entry.top_weight}kg × {entry.top_reps}
                                </span>
                              ))}
                              {topSets.length > 3 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-50 text-[11px] text-slate-400">
                                  +{topSets.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">
                              {totalExercises} exercises completed
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-sky-600 hover:bg-sky-50 self-end sm:self-center"
                      >
                        <Link href="/track">
                          Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">No workout logs yet</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Complete and save your first routine session in the Track view to start recording volume and streaks.
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-xs mt-2"
                >
                  <Link href="/track">Track Your First Workout</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Quick Routine Actions (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Active Routine
          </h2>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                  7-Day Schedule
                </span>
                <span className={`h-2 w-2 rounded-full ${activePlan ? "bg-emerald-500" : "bg-amber-400"}`} />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 pt-1">
                {activePlan ? "Weekly Split Routine" : "No Active Routine"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {activePlan
                  ? "Custom exercises and targeted weights assigned."
                  : "Configure your weekly split and exercises."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {activePlan ? (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {DAY_NAMES.map((name, idx) => {
                    const dayObj = activePlan.plan_days?.find((d) => d.day_of_week === idx);
                    const isRest = dayObj?.is_rest ?? false;
                    const exCount = dayObj?.plan_exercises?.length ?? 0;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg ${
                          idx === todayDayOfWeek ? "bg-sky-50 text-sky-900 font-semibold" : "text-slate-600"
                        }`}
                      >
                        <span>{name}</span>
                        <span className="text-[11px] text-slate-400">
                          {isRest ? "Rest" : `${exCount} exercises`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    Create a weekly routine to get personalized daily tracking.
                  </p>
                </div>
              )}

              <Button
                asChild
                className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs"
              >
                <Link href="/plan" className="flex items-center justify-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>{activePlan ? "Modify Plan Routine" : "Create Routine Plan"}</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
