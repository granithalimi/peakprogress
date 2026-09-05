"use client";

import { useState, useMemo, useEffect } from "react";
import { CatalogExercise } from "@/lib/types";
import { fetchCatalogExercises } from "@/lib/exercise-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Plus,
  Dumbbell,
  Check,
  Layers,
  Sparkles,
} from "lucide-react";

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: CatalogExercise) => void;
  alreadySelectedNames?: string[];
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelectExercise,
  alreadySelectedNames = [],
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<CatalogExercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch exercises from API on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    fetchCatalogExercises()
      .then((data) => {
        if (isMounted) {
          setExercises(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Extract unique categories from fetched exercises
  const categories = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.category) set.add(ex.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [exercises]);

  // Filter exercises by Category and Search Query
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesCategory =
        selectedCategory === "All" ||
        ex.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [exercises, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Exercise Library
              </h2>
              <p className="text-xs text-slate-500">
                Browse categories and add exercises to your routine
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search exercises by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-xl bg-white border-slate-200 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Categories Tab Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-sky-500 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercise List / Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[280px]">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-500 border-t-transparent mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                Fetching exercise library...
              </p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
              <Layers className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No exercises found</p>
              <p className="text-xs text-slate-400">
                Try searching with a different term or select another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredExercises.map((exercise) => {
                const isAlreadyAdded = alreadySelectedNames.some(
                  (name) => name.toLowerCase() === exercise.name.toLowerCase()
                );

                return (
                  <div
                    key={exercise.id}
                    onClick={() => {
                      onSelectExercise(exercise);
                      onClose();
                    }}
                    className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer group ${
                      isAlreadyAdded
                        ? "bg-sky-50/40 border-sky-200 hover:border-sky-300"
                        : "bg-white border-slate-200/80 hover:border-sky-500 hover:shadow-sm"
                    }`}
                  >
                    {/* Exercise Pic / Thumbnail */}
                    <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                      {exercise.pic ? (
                        <img
                          src={exercise.pic}
                          alt={exercise.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <Dumbbell className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    {/* Exercise Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                        {exercise.name}
                      </h4>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                        {exercise.category}
                      </span>
                    </div>

                    {/* Action Icon */}
                    <div className="shrink-0">
                      {isAlreadyAdded ? (
                        <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-sky-500 group-hover:text-white flex items-center justify-center transition-colors">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredExercises.length} exercises found</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
