"use client";

import { useState, useMemo, useEffect } from "react";
import { saveWorkoutPlan } from "@/features/plan/actions";
import { CatalogExercise, PlanDayInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Save,
  Moon,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  X,
  Plus,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PlanManagerProps {
  initialDays: PlanDayInput[];
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

export function PlanManager({ initialDays }: PlanManagerProps) {
  const [days, setDays] = useState<PlanDayInput[]>(() => {
    // Ensure all 7 days exist
    return Array.from({ length: 7 }, (_, i) => {
      const found = initialDays.find((d) => d.day_of_week === i);
      if (found) {
        return {
          day_of_week: i,
          is_rest: found.is_rest,
          exercises: found.exercises || [],
        };
      }
      return {
        day_of_week: i,
        is_rest: i === 6, // Sunday rest by default
        exercises: [],
      };
    });
  });

  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Exercise catalog state
  const [catalogExercises, setCatalogExercises] = useState<CatalogExercise[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  // Debounce search query input (350ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedSearchQuery("");
      setCursor(null);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setCursor(null);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Pagination & Cursor State
  const [cursor, setCursor] = useState<{
    before?: string;
    after?: string;
  } | null>(null);
  const [pageInfo, setPageInfo] = useState<{
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  }>({
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Fetch exercise library from API (Browse or Live Search) with cursor pagination
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoadingExercises(true);

    const params = new URLSearchParams();
    if (cursor?.after) params.append("after", cursor.after);
    if (cursor?.before) params.append("before", cursor.before);

    let baseUrl = "https://oss.exercisedb.dev/api/v1/exercises";

    if (debouncedSearchQuery) {
      // Live search mode
      baseUrl = "https://oss.exercisedb.dev/api/v1/exercises/search";
      params.append("search", debouncedSearchQuery);
    } else if (selectedCategory && selectedCategory !== "All") {
      // Browse by category mode
      baseUrl = "https://oss.exercisedb.dev/api/v1/exercises/bodyparts";
      params.append("bodyParts", selectedCategory.toLowerCase());
    }

    const queryString = params.toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        setCatalogExercises(
          (json.data || []).map((item: CatalogExercise) => ({
            exerciseId: item.exerciseId || item.id,
            name: item.name,
            bodyParts: item.bodyParts || (item.category ? [item.category] : []),
            category: item.bodyParts?.[0] || item.category || "Other",
            gifUrl: item.gifUrl || item.pic,
          })),
        );

        if (json.pageInfo || json.pagination || json.meta) {
          const meta = json.pageInfo || json.pagination || json.meta;
          setPageInfo({
            hasNextPage: Boolean(meta.hasNextPage ?? meta.nextCursor),
            hasPreviousPage: Boolean(
              meta.hasPreviousPage ?? meta.previousCursor,
            ),
            nextCursor: meta.nextCursor,
            previousCursor: meta.previousCursor || meta.prevCursor,
          });
        } else {
          setPageInfo({
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }
        setIsLoadingExercises(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        console.error("Failed to fetch exercises:", err);
        if (isMounted) {
          setIsLoadingExercises(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [cursor, selectedCategory, debouncedSearchQuery]);

  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    let isMounted = true;
    fetch("https://oss.exercisedb.dev/api/v1/bodyparts")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.data) {
          const fetchedCategories = json.data.map(
            (item: { name: string }) => item.name,
          );
          setCategories(["All", ...fetchedCategories.sort()]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch bodyparts categories:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCatalogExercises = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") {
      return catalogExercises;
    }
    // When a specific category is selected, ensure displayed exercises match
    return catalogExercises.filter((ex) => {
      return (
        ex.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        ex.bodyParts?.some(
          (bp) => bp.toLowerCase() === selectedCategory.toLowerCase(),
        )
      );
    });
  }, [catalogExercises, selectedCategory]);

  const currentDayData = days[selectedDay];

  const handleToggleRest = () => {
    setDays((prev) =>
      prev.map((d, idx) => {
        if (idx === selectedDay) {
          return {
            ...d,
            is_rest: !d.is_rest,
          };
        }
        return d;
      }),
    );
  };

  const handleToggleExercise = (exercise: CatalogExercise) => {
    setDays((prev) =>
      prev.map((d, idx) => {
        if (idx === selectedDay) {
          const exists = d.exercises.some(
            (e) => e.name.toLowerCase() === exercise.name.toLowerCase(),
          );
          if (exists) {
            return {
              ...d,
              exercises: d.exercises.filter(
                (e) => e.name.toLowerCase() !== exercise.name.toLowerCase(),
              ),
            };
          } else {
            return {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  exerciseId: exercise.exerciseId,
                  name: exercise.name,
                  target_sets: 3,
                  target_reps: 10,
                  target_weight: 0,
                  order_index: d.exercises.length,
                },
              ],
            };
          }
        }
        return d;
      }),
    );
  };

  const handleRemoveExercise = (exerciseName: string) => {
    setDays((prev) =>
      prev.map((d, idx) => {
        if (idx === selectedDay) {
          return {
            ...d,
            exercises: d.exercises.filter(
              (e) => e.name.toLowerCase() !== exerciseName.toLowerCase(),
            ),
          };
        }
        return d;
      }),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      await saveWorkoutPlan(days);
      setSaveStatus({
        type: "success",
        message: "Workout routine saved successfully!",
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setSaveStatus({
        type: "error",
        message: err?.message || "Failed to save workout plan",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100">
            <Sparkles className="h-3 w-3" />
            <span>Routine Planner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Weekly Workout Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure your 7-day routine split and target exercises.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm transition-all active:scale-[0.99] cursor-pointer self-start sm:self-center"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving Plan...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Save Routine</span>
            </div>
          )}
        </Button>
      </div>

      {saveStatus && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl border text-xs sm:text-sm font-medium animate-in fade-in ${
            saveStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {saveStatus.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* 7-Day Selector Bar */}
      <div className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 min-w-[340px]">
          {days.map((day, idx) => {
            const isSelected = selectedDay === idx;
            const isRest = day.is_rest;
            const exCount = day.exercises?.length || 0;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDay(idx)}
                className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400"
                    : "bg-slate-50/70 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                }`}
              >
                <span
                  className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isSelected ? "text-white" : "text-slate-800"}`}
                >
                  {DAY_SHORT[idx]}
                </span>
                <span
                  className={`mt-1 text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-sky-600/60 text-white"
                      : isRest
                        ? "bg-slate-200 text-slate-600"
                        : "bg-sky-100/80 text-sky-700"
                  }`}
                >
                  {isRest ? "Rest" : `${exCount} ex`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Single Unified Card */}
      <Card className="border border-slate-200/80 bg-white shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                Day Schedule
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {DAY_NAMES[selectedDay]}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-500">
              {currentDayData.is_rest
                ? "This day is marked as a rest day."
                : `${currentDayData.exercises.length} exercise${currentDayData.exercises.length === 1 ? "" : "s"} selected for ${DAY_NAMES[selectedDay]}.`}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Button
              type="button"
              variant={currentDayData.is_rest ? "default" : "outline"}
              onClick={handleToggleRest}
              className={`h-10 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentDayData.is_rest
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <Moon className="h-3.5 w-3.5 mr-1.5" />
              {currentDayData.is_rest ? "Rest Day Active" : "Mark as Rest Day"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {currentDayData.is_rest ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Moon className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Rest & Recovery Day
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                  Rest days allow your muscles to rebuild and recover. You can
                  toggle off Rest Day anytime to select exercises.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleRest}
                className="rounded-xl text-xs font-semibold mt-2 cursor-pointer"
              >
                Convert to Workout Day
              </Button>
            </div>
          ) : (
            <>
              {/* Selected Exercises Chips */}
              {currentDayData.exercises.length > 0 && (
                <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>
                      Selected for {DAY_NAMES[selectedDay]} (
                      {currentDayData.exercises.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentDayData.exercises.map((exercise) => (
                      <div
                        key={exercise.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-sky-900 text-xs font-medium shadow-2xs"
                      >
                        <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>{exercise.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(exercise.name)}
                          className="ml-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label={`Remove ${exercise.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Categories Section */}
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search exercises by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-9 pr-8 rounded-xl bg-slate-50/60 border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-black"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Categories Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (selectedCategory !== cat) {
                            setSelectedCategory(cat);
                            setCursor(null);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? "bg-sky-500 text-white shadow-xs"
                            : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 font-medium">
                    Page controls
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        !pageInfo.hasPreviousPage && !pageInfo.previousCursor
                      }
                      onClick={() => {
                        if (pageInfo.previousCursor) {
                          setCursor({ before: pageInfo.previousCursor });
                        }
                      }}
                      className="h-8 w-8 p-0"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!pageInfo.hasNextPage && !pageInfo.nextCursor}
                      onClick={() => {
                        if (pageInfo.nextCursor) {
                          setCursor({ after: pageInfo.nextCursor });
                        }
                      }}
                      className="h-8 w-8 p-0"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Exercises Grid / List */}
              <div className="space-y-2">
                {isLoadingExercises ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mx-auto" />
                    <p className="text-xs font-medium text-slate-500">
                      Loading exercises...
                    </p>
                  </div>
                ) : filteredCatalogExercises.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                    <Layers className="h-8 w-8 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">
                      No exercises found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try searching with a different term or category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredCatalogExercises.map((exercise) => {
                      const isAlreadyAdded = currentDayData.exercises.some(
                        (e) =>
                          e.name.toLowerCase() === exercise.name.toLowerCase(),
                      );

                      return (
                        <div
                          key={exercise.gifUrl || exercise.exerciseId || exercise.name}
                          onClick={() => handleToggleExercise(exercise)}
                          className={`relative flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none group overflow-hidden ${
                            isAlreadyAdded
                              ? "bg-sky-50/50 border-sky-400 shadow-xs"
                              : "bg-white border-slate-200/80 hover:border-sky-500 hover:shadow-md"
                          }`}
                        >
                          {/* Image Container with Toggle Badge */}
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5">
                            {exercise.gifUrl ? (
                              <img
                                src={exercise.gifUrl}
                                alt={exercise.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <Dumbbell className="h-8 w-8 text-slate-300" />
                            )}

                            {/* Status Indicator Button */}
                            <div className="absolute top-2 right-2">
                              {isAlreadyAdded ? (
                                <div className="h-7 w-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                                  <Check className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-xs text-slate-600 border border-slate-200/80 group-hover:bg-sky-500 group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all shadow-2xs">
                                  <Plus className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Exercise Content */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <h4
                              className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-sky-600 transition-colors"
                              title={exercise.name}
                            >
                              {exercise.name}
                            </h4>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              {exercise.bodyParts && exercise.bodyParts[0] && (
                                <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 truncate">
                                  {exercise.bodyParts[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 font-medium">
              Page controls
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pageInfo.hasPreviousPage && !pageInfo.previousCursor}
                onClick={() => {
                  if (pageInfo.previousCursor) {
                    setCursor({ before: pageInfo.previousCursor });
                  }
                }}
                className="h-8 w-8 p-0"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pageInfo.hasNextPage && !pageInfo.nextCursor}
                onClick={() => {
                  if (pageInfo.nextCursor) {
                    setCursor({ after: pageInfo.nextCursor });
                  }
                }}
                className="h-8 w-8 p-0"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
