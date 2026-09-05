export interface WorkoutPlan {
  id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  day_of_week: number; // 0 = Monday, ..., 6 = Sunday
  is_rest: boolean;
  order_index: number;
  exercises?: PlanExercise[];
}

// Alias for plan_days matching database table naming
export type plan_days = PlanDay;

export interface PlanExercise {
  id: string;
  plan_day_id: string;
  name: string;
  target_sets: number;
  target_reps: number;
  target_weight: number;
  order_index: number;
}

// Alias for plan_exercises matching database table naming
export type plan_exercises = PlanExercise;

export interface WorkoutLog {
  id: string;
  user_id: string;
  plan_id: string | null;
  week_start_date: string;
  day_of_week: number;
  completed: boolean;
  notes: string | null;
  created_at: string;
  entries?: WorkoutLogEntry[];
  workout_log_entries?: WorkoutLogEntry[];
}

export interface WorkoutLogEntry {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  top_weight: number;
  top_reps: number;
  sets_completed: number;
  total_sets: number;
  completed: boolean;
}

// Alias for workout_log_entries matching database table naming
export type workout_log_entries = WorkoutLogEntry;

export interface DashboardMetrics {
  totalWorkouts: number;
  currentStreak: number;
  weeklyCompletionRate: number;
  totalVolume: number;
}

export interface WeeklyProgressDay {
  dayName: string;
  dayOfWeek: number;
  dateStr: string;
  isCompleted: boolean;
  isToday: boolean;
  isRest: boolean;
}

// External/Catalog Exercise Item Interface
export interface CatalogExercise {
  exerciseId?: string;
  id?: string;
  name: string;
  bodyParts?: string[];
  category?: string;
  gifUrl?: string; // Image URL / preview
  pic?: string;
}

export interface PlanDayInput {
  day_of_week: number;
  is_rest: boolean;
  exercises: {
    id?: string;
    name: string;
    target_sets: number;
    target_reps: number;
    target_weight: number;
    order_index: number;
  }[];
}

