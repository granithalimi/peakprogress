"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PlanDayInput } from "@/lib/types";

export async function saveWorkoutPlan(days: PlanDayInput[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized. Please log in to save your plan.");
  }

  // 1. Get or create active workout plan for user
  const { data: existingPlans, error: planFetchErr } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  if (planFetchErr) {
    throw new Error(planFetchErr.message);
  }

  let planId: string;

  if (existingPlans && existingPlans.length > 0) {
    planId = existingPlans[0].id;
    // Update plan timestamp
    await supabase
      .from("workout_plans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", planId);
  } else {
    const { data: newPlan, error: createPlanErr } = await supabase
      .from("workout_plans")
      .insert({ user_id: user.id, is_active: true })
      .select("id")
      .single();

    if (createPlanErr || !newPlan) {
      throw new Error(createPlanErr?.message || "Failed to create workout plan");
    }
    planId = newPlan.id;
  }

  // 2. Fetch existing plan_days for this plan
  const { data: existingPlanDays, error: daysFetchErr } = await supabase
    .from("plan_days")
    .select("id, day_of_week")
    .eq("plan_id", planId);

  if (daysFetchErr) {
    throw new Error(daysFetchErr.message);
  }

  const existingDaysMap = new Map<number, string>();
  existingPlanDays?.forEach((d) => {
    existingDaysMap.set(d.day_of_week, d.id);
  });

  // 3. Process all 7 days (0..6)
  for (const dayInput of days) {
    let dayId = existingDaysMap.get(dayInput.day_of_week);

    if (!dayId) {
      // Insert new plan_day
      const { data: newDay, error: insertDayErr } = await supabase
        .from("plan_days")
        .insert({
          plan_id: planId,
          day_of_week: dayInput.day_of_week,
          is_rest: dayInput.is_rest,
          order_index: dayInput.day_of_week,
        })
        .select("id")
        .single();

      if (insertDayErr || !newDay) {
        throw new Error(insertDayErr?.message || "Failed to insert plan day");
      }
      dayId = newDay.id;
    } else {
      // Update existing plan_day
      const { error: updateDayErr } = await supabase
        .from("plan_days")
        .update({
          is_rest: dayInput.is_rest,
          order_index: dayInput.day_of_week,
        })
        .eq("id", dayId);

      if (updateDayErr) {
        throw new Error(updateDayErr.message);
      }
    }

    // 4. Synchronize exercises for this day:
    // Delete current exercises and insert clean updated list
    const { error: deleteExercisesErr } = await supabase
      .from("plan_exercises")
      .delete()
      .eq("plan_day_id", dayId);

    if (deleteExercisesErr) {
      throw new Error(deleteExercisesErr.message);
    }

    if (!dayInput.is_rest && dayInput.exercises && dayInput.exercises.length > 0) {
      const exerciseInserts = dayInput.exercises
        .filter((ex) => ex.name.trim().length > 0)
        .map((ex, idx) => ({
          plan_day_id: dayId!,
          name: ex.name.trim(),
          image: ex.image || null,
          order_index: idx,
        }));

      if (exerciseInserts.length > 0) {
        const { error: insertExercisesErr } = await supabase
          .from("plan_exercises")
          .insert(exerciseInserts);

        if (insertExercisesErr) {
          throw new Error(insertExercisesErr.message);
        }
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/track");

  return { success: true };
}
