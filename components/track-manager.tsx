"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveWorkoutSession } from "@/features/track/actions";
import { shiftWeek, formatWeekRange, parseISODate } from "@/lib/date-utils";
import { WorkoutPlan, PlanDay, PlanExercise, WorkoutLog, WorkoutLogEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Dumbbell,
  Moon,
  Save,
  Check,
  ArrowRight,
  AlertCircle,
  FileEdit,
} from "lucide-react";

interface ExerciseItemState {
  id?: string;
  name: string;
  image?: string | null;
  top_weight: string; // string so it can be empty/null in input
  top_reps: string;
  completed: boolean;
}

interface TrackManagerProps {
  initialWeekStartDate: string;
  currentWeekStartDate: string;
  initialDayOfWeek: number;
  activePlan: (WorkoutPlan & { plan_days: (PlanDay & { plan_exercises: PlanExercise[] })[] }) | null;
  initialLogs: (WorkoutLog & { workout_log_entries: WorkoutLogEntry[] })[];
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TrackManager({
  initialWeekStartDate,
  currentWeekStartDate,
  initialDayOfWeek,
  activePlan,
  initialLogs,
}: TrackManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active navigation states
  const [selectedWeek, setSelectedWeek] = useState<string>(initialWeekStartDate);
  const [selectedDay, setSelectedDay] = useState<number>(initialDayOfWeek);

  // Status feedback toast/alert
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notes state
  const [notes, setNotes] = useState<string>("");

  // Determine current day of week relative to today for badge styling
  const today = new Date();
  const todayDayOfWeek = (today.getDay() + 6) % 7;
  const isCurrentWeek = selectedWeek === currentWeekStartDate;

  // Find workout log for selected (week, day)
  const currentSessionLog = useMemo(() => {
    return initialLogs.find(
      (log) => log.week_start_date === selectedWeek && log.day_of_week === selectedDay
    );
  }, [initialLogs, selectedWeek, selectedDay]);

  // Find plan details for the selected day
  const planDay = useMemo(() => {
    return activePlan?.plan_days?.find((d) => d.day_of_week === selectedDay);
  }, [activePlan, selectedDay]);

  const isRestDay = planDay?.is_rest ?? false;

  // Initialize/compute exercises state for current day
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseItemState[]>>({});

  // Helper key to store local changes per (week-day)
  const currentSessionKey = `${selectedWeek}_${selectedDay}`;

  const currentExercises: ExerciseItemState[] = useMemo(() => {
    if (exerciseStates[currentSessionKey]) {
      return exerciseStates[currentSessionKey];
    }

    const plannedList = planDay?.plan_exercises || [];
    const logEntries = currentSessionLog?.workout_log_entries || [];

    // Map planned exercises and join with existing log entries if available
    return plannedList.map((ex) => {
      const match = logEntries.find(
        (entry) => entry.exercise_name.toLowerCase() === ex.name.toLowerCase()
      );

      return {
        id: ex.id,
        name: ex.name,
        image: ex.image || null,
        // If logged, use logged values; if not logged yet, start empty (null)
        top_weight:
          match && match.top_weight !== null && match.top_weight !== undefined
            ? String(match.top_weight)
            : "",
        top_reps:
          match && match.top_reps !== null && match.top_reps !== undefined
            ? String(match.top_reps)
            : "",
        completed: match ? Boolean(match.completed) : false,
      };
    });
  }, [exerciseStates, currentSessionKey, planDay, currentSessionLog]);

  // Update specific exercise state
  const handleUpdateExercise = (
    index: number,
    field: keyof ExerciseItemState,
    value: any
  ) => {
    const updated = [...currentExercises];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setExerciseStates((prev) => ({
      ...prev,
      [currentSessionKey]: updated,
    }));
  };

  // Week navigation handlers
  const handleNavigateWeek = (offset: number) => {
    const newWeek = shiftWeek(selectedWeek, offset);
    setSelectedWeek(newWeek);
    setFeedback(null);
    router.replace(`/track?week=${newWeek}&day=${selectedDay}`);
  };

  const handleResetToCurrentWeek = () => {
    setSelectedWeek(currentWeekStartDate);
    setSelectedDay(todayDayOfWeek);
    setFeedback(null);
    router.replace(`/track?week=${currentWeekStartDate}&day=${todayDayOfWeek}`);
  };

  const handleSelectDay = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setFeedback(null);
    router.replace(`/track?week=${selectedWeek}&day=${dayIndex}`);
  };

  // Save Workout Session
  const handleSaveSession = () => {
    startTransition(async () => {
      try {
        setFeedback(null);

        // Check if all exercises are completed
        const allCompleted =
          currentExercises.length > 0 &&
          currentExercises.every((ex) => ex.completed);

        const hasAnyActivity =
          currentExercises.some((ex) => ex.completed || ex.top_weight !== "" || ex.top_reps !== "") ||
          isRestDay;

        const payload = {
          week_start_date: selectedWeek,
          day_of_week: selectedDay,
          plan_id: activePlan?.id || null,
          completed: allCompleted || hasAnyActivity,
          notes: notes || currentSessionLog?.notes || null,
          entries: currentExercises.map((ex) => ({
            exercise_name: ex.name,
            top_weight: ex.top_weight === "" ? 0 : Number(ex.top_weight) || 0,
            top_reps: ex.top_reps === "" ? 0 : Number(ex.top_reps) || 0,
            completed: ex.completed,
          })),
        };

        const result = await saveWorkoutSession(payload);
        if (result.success) {
          setFeedback({
            type: "success",
            text: "Workout session saved successfully!",
          });
          router.refresh();
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err.message || "Failed to save workout session.",
        });
      }
    });
  };

  // Date calculation for day badges
  const weekStartObj = parseISODate(selectedWeek);

  // If no plan exists, display empty state
  if (!activePlan || !activePlan.plan_days || activePlan.plan_days.length === 0) {
    return (
      <Card className="border-slate-200/80 shadow-sm max-w-xl mx-auto overflow-hidden text-center py-12 px-6 bg-white">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-5 ring-8 ring-sky-50/50">
          <Dumbbell className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
          No workout plan found
        </CardTitle>
        <CardDescription className="text-slate-600 max-w-md mx-auto mb-6 text-sm">
          You need an active workout routine before tracking workouts. Create your personalized 7-day routine in just a few taps.
        </CardDescription>
        <Button
          asChild
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl px-6 h-11 shadow-sm shadow-sky-500/20 gap-2 cursor-pointer"
        >
          <Link href="/plan">
            Create Workout Plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Card>
    );
  }

  // Calculate day completion status for the 7 day tabs
  const daysStatus = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(weekStartObj);
    dayDate.setDate(dayDate.getDate() + i);

    const logForDay = initialLogs.find(
      (log) => log.week_start_date === selectedWeek && log.day_of_week === i
    );
    const planForDay = activePlan.plan_days.find((d) => d.day_of_week === i);

    const isDayCompleted = logForDay?.completed ?? false;
    const isDayRest = planForDay?.is_rest ?? false;
    const exerciseCount = planForDay?.plan_exercises?.length ?? 0;
    const isToday = isCurrentWeek && i === todayDayOfWeek;

    return {
      dayIndex: i,
      dayShort: DAY_SHORT[i],
      dayNumber: dayDate.getDate(),
      isCompleted: isDayCompleted,
      isRest: isDayRest,
      exerciseCount,
      isToday,
    };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Week Navigator */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workout Week
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900">
              {formatWeekRange(selectedWeek)}
            </div>
          </div>
        </div>

        {/* Navigation buttons: Previous, Today, Next */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigateWeek(-1)}
            disabled={isPending}
            className="rounded-xl border-slate-200 h-9 px-3 gap-1 bg-gray-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          {!isCurrentWeek ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToCurrentWeek}
              disabled={isPending}
              className="rounded-xl border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 h-9 px-3 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              This Week
            </Button>
          ) : (
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              Current Week
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigateWeek(1)}
            disabled={isPending}
            className="rounded-xl border-slate-200 h-9 px-3 gap-1 text-slate-700 bg-gray-300 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            title="Next Week"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 7-Day Selector Bar */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {daysStatus.map((d) => {
          const isSelected = selectedDay === d.dayIndex;
          return (
            <button
              key={d.dayIndex}
              onClick={() => handleSelectDay(d.dayIndex)}
              disabled={isPending}
              className={`flex flex-col items-center py-2.5 px-1 rounded-xl sm:rounded-2xl border transition-all text-center relative cursor-pointer ${
                isSelected
                  ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/25 scale-[1.02]"
                  : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700"
              }`}
            >
              {/* Today indicator dot */}
              {d.isToday && (
                <span
                  className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-sky-500"
                  }`}
                />
              )}

              <span
                className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                  isSelected ? "text-sky-100" : "text-slate-500"
                }`}
              >
                {d.dayShort}
              </span>
              <span
                className={`text-sm sm:text-lg font-extrabold my-0.5 ${
                  isSelected ? "text-white" : "text-slate-900"
                }`}
              >
                {d.dayNumber}
              </span>

              {/* Status icon/badge */}
              <div className="mt-0.5">
                {d.isCompleted ? (
                  <CheckCircle2
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                      isSelected ? "text-white" : "text-emerald-500"
                    }`}
                  />
                ) : d.isRest ? (
                  <Moon
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                      isSelected ? "text-sky-100" : "text-slate-400"
                    }`}
                  />
                ) : (
                  <span
                    className={`text-[10px] font-medium leading-none ${
                      isSelected ? "text-sky-100" : "text-slate-400"
                    }`}
                  >
                    {d.exerciseCount} ex
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback Toast/Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm animate-in fade-in slide-in-from-top-1 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Day Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Day Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {DAY_NAMES[selectedDay]}
              </h2>
              {isRestDay ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Moon className="h-3 w-3" /> Rest Day
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100">
                  <Dumbbell className="h-3 w-3" /> {currentExercises.length} Exercises Planned
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {currentSessionLog?.completed
                ? "Logged session recorded for this day."
                : "Log your top sets and tick off completed sets below."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-3 gap-1.5 border-slate-200 text-xs text-slate-600 bg-gray-300 hover:text-slate-900 hover:bg-slate-100"
            >
              <Link href="/plan">
                <FileEdit className="h-3.5 w-3.5" />
                Edit Plan
              </Link>
            </Button>
          </div>
        </div>

        {/* Content Body: Rest Day vs Workout Exercises */}
        <div className="p-5 sm:p-6 space-y-6">
          {isRestDay ? (
            <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mx-auto mb-3">
                <Moon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Rest & Recovery Day</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
                Hydrate, prioritize high quality sleep, and allow your muscle fibers to rebuild.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSession}
                disabled={isPending}
                className="rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold"
              >
                Mark Rest Day Complete
              </Button>
            </div>
          ) : currentExercises.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 mx-auto mb-3">
                <Dumbbell className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No exercises planned for {DAY_NAMES[selectedDay]}</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
                Add exercises to your routine in the Plan tab to track them here.
              </p>
              <Button
                asChild
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold px-4 h-9"
              >
                <Link href="/plan">Configure Exercises</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentExercises.map((exercise, exIndex) => {
                const isExCompleted = exercise.completed;

                return (
                  <div
                    key={exercise.id || `${exercise.name}_${exIndex}`}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isExCompleted
                        ? "bg-slate-50/90 border-emerald-200/70 shadow-md"
                        : "bg-white border-slate-200/90 shadow-md"
                    }`}
                  >
                    {/* Exercise Header */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-base sm:text-lg font-bold transition-all ${
                              isExCompleted
                                ? "text-slate-800 line-through decoration-slate-400 decoration-2"
                                : "text-slate-900"
                            }`}
                          >
                            {exercise.name}
                          </h4>
                          {isExCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <Check className="h-3 w-3" /> Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isExCompleted
                            ? "Exercise completed for this session."
                            : "Record your top set and mark the exercise done when finished."}
                        </p>
                      </div>
                    </div>

                    {/* Exercise Body: Big Picture on Left + Inputs & Mark Done on Right */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      {/* Enlarged Exercise Image - Fixed Square */}
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 aspect-square shrink-0 mx-auto sm:mx-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shadow-inner">
                        {exercise.image ? (
                          <img
                            src={exercise.image}
                            alt={exercise.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                            <Dumbbell className="h-8 w-8" />
                            <span className="text-[11px] font-medium">No preview</span>
                          </div>
                        )}
                      </div>

                      {/* Controls at the same level: Top Weight, Top Reps, and Mark Done */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Top Weight (kg)
                          </label>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="e.g. 80"
                            value={exercise.top_weight}
                            onChange={(e) =>
                              handleUpdateExercise(
                                exIndex,
                                "top_weight",
                                e.target.value
                              )
                            }
                            className="h-10 rounded-xl border-slate-200 bg-white text-sm text-black shadow-2xs"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Top Reps
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 10"
                            value={exercise.top_reps}
                            onChange={(e) =>
                              handleUpdateExercise(
                                exIndex,
                                "top_reps",
                                e.target.value
                              )
                            }
                            className="h-10 rounded-xl border-slate-200 bg-white text-sm text-black shadow-2xs"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="hidden sm:block text-xs font-semibold text-transparent mb-1.5 select-none">
                            Status
                          </label>
                          <Button
                            type="button"
                            onClick={() =>
                              handleUpdateExercise(
                                exIndex,
                                "completed",
                                !exercise.completed
                              )
                            }
                            className={`w-full h-10 rounded-xl text-xs sm:text-sm font-bold transition-all gap-1.5 cursor-pointer shadow-2xs ${
                              isExCompleted
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                : "bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900"
                            }`}
                          >
                            <Check
                              className={`h-4 w-4 transition-transform ${
                                isExCompleted ? "scale-110 text-white" : "text-slate-400"
                              }`}
                            />
                            {isExCompleted ? "Completed" : "Mark Done"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Session Notes */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Workout Notes (optional)
            </label>
            <Input
              type="text"
              placeholder="Felt strong today, good pump on incline bench..."
              value={notes || currentSessionLog?.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 rounded-xl border-slate-200 text-sm"
            />
          </div>

          {/* Save & Finish Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              onClick={handleSaveSession}
              disabled={isPending}
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11 px-7 shadow-sm shadow-sky-500/20 gap-2 cursor-pointer"
            >
              {isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save & Finish Workout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
