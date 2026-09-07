import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { PlanManager } from "@/components/plan-manager";
import { PlanDayInput } from "@/lib/types";
import { redirect } from "next/navigation";
import { plan_days, plan_exercises} from "@/lib/types";

export default async function PlanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch active workout plan with all days and exercises
  const { data: plans } = await supabase
    .from("workout_plans")
    .select("*, plan_days(*, plan_exercises(*))")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const activePlan = plans && plans.length > 0 ? plans[0] : null;

  // Format initial days data (0..6)
  const initialDays: PlanDayInput[] = Array.from({ length: 7 }, (_, i) => {
    const dayRecord = activePlan?.plan_days?.find((d: plan_days) => d.day_of_week === i);

    if (dayRecord) {
      const sortedExercises = (dayRecord.plan_exercises || []).sort(
        (a: plan_exercises, b: plan_exercises ) => (a.order_index || 0) - (b.order_index || 0)
      );

      return {
        day_of_week: i,
        is_rest: dayRecord.is_rest,
        exercises: sortedExercises.map((ex: plan_exercises) => ({
          id: ex.id,
          name: ex.name,
          image: ex.image || null,
          order_index: ex.order_index,
        })),
      };
    }

    return {
      day_of_week: i,
      is_rest: i === 6, // default Sunday to rest
      exercises: [],
    };
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <AppHeader userEmail={user.email} />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8">
        <PlanManager initialDays={initialDays} />
      </main>
    </div>
  );
}
