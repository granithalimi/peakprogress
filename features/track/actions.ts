"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SaveWorkoutEntryInput {
  exercise_name: string;
  top_weight: number;
  top_reps: number;
  completed: boolean;
}

export interface SaveWorkoutSessionInput {
  week_start_date: string; // YYYY-MM-DD
  day_of_week: number;     // 0..6
  plan_id?: string | null;
  completed: boolean;
  notes?: string | null;
  entries: SaveWorkoutEntryInput[];
}

export async function saveWorkoutSession(input: SaveWorkoutSessionInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized. Please log in to save workout logs.");
  }

  // 1. Check if a workout_logs row already exists for this user, week, and day
  const { data: existingLogs, error: fetchLogErr } = await supabase
    .from("workout_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", input.week_start_date)
    .eq("day_of_week", input.day_of_week)
    .limit(1);

  if (fetchLogErr) {
    throw new Error(fetchLogErr.message);
  }

  let workoutLogId: string;

  if (existingLogs && existingLogs.length > 0) {
    workoutLogId = existingLogs[0].id;
    const { error: updateLogErr } = await supabase
      .from("workout_logs")
      .update({
        completed: input.completed,
        notes: input.notes || null,
        plan_id: input.plan_id || null,
      })
      .eq("id", workoutLogId);

    if (updateLogErr) {
      throw new Error(updateLogErr.message);
    }
  } else {
    const { data: newLog, error: createLogErr } = await supabase
      .from("workout_logs")
      .insert({
        user_id: user.id,
        plan_id: input.plan_id || null,
        week_start_date: input.week_start_date,
        day_of_week: input.day_of_week,
        completed: input.completed,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (createLogErr || !newLog) {
      throw new Error(createLogErr?.message || "Failed to create workout log");
    }
    workoutLogId = newLog.id;
  }

  // 2. Synchronize workout_log_entries
  // Delete existing entries for this log session and re-insert fresh values
  const { error: deleteEntriesErr } = await supabase
    .from("workout_log_entries")
    .delete()
    .eq("workout_log_id", workoutLogId);

  if (deleteEntriesErr) {
    throw new Error(deleteEntriesErr.message);
  }

  if (input.entries && input.entries.length > 0) {
    const entryInserts = input.entries.map((entry) => ({
      workout_log_id: workoutLogId,
      exercise_name: entry.exercise_name,
      top_weight: Number(entry.top_weight) || 0,
      top_reps: Number(entry.top_reps) || 0,
      completed: entry.completed,
    }));

    const { error: insertEntriesErr } = await supabase
      .from("workout_log_entries")
      .insert(entryInserts);

    if (insertEntriesErr) {
      throw new Error(insertEntriesErr.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/track");

  return { success: true, workoutLogId };
}
