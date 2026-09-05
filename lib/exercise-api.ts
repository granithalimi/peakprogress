import { CatalogExercise } from "./types";

/**
 * Exercise API Configuration:
 * Replace or customize EXERCISE_API_URL / headers with your live endpoint.
 */
export const EXERCISE_API_ENDPOINT =
  process.env.NEXT_PUBLIC_EXERCISES_API_URL || "/api/exercises";

/**
 * Fallback/Initial mock exercise database in case external API is not configured yet.
 * Structure matches: { id, name, pic, category }
 */
export const MOCK_CATALOG_EXERCISES: CatalogExercise[] = [
  // Chest
  {
    id: "chest-1",
    name: "Barbell Bench Press",
    category: "Chest",
    pic: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "chest-2",
    name: "Incline Dumbbell Press",
    category: "Chest",
    pic: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "chest-3",
    name: "Cable Chest Fly",
    category: "Chest",
    pic: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "chest-4",
    name: "Push-Ups",
    category: "Chest",
    pic: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&auto=format&fit=crop&q=80",
  },

  // Back
  {
    id: "back-1",
    name: "Barbell Deadlift",
    category: "Back",
    pic: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "back-2",
    name: "Lat Pulldown",
    category: "Back",
    pic: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "back-3",
    name: "Bent-Over Barbell Row",
    category: "Back",
    pic: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "back-4",
    name: "Seated Cable Row",
    category: "Back",
    pic: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&auto=format&fit=crop&q=80",
  },

  // Legs
  {
    id: "legs-1",
    name: "Barbell Back Squat",
    category: "Legs",
    pic: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "legs-2",
    name: "Leg Press",
    category: "Legs",
    pic: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "legs-3",
    name: "Romanian Deadlift",
    category: "Legs",
    pic: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "legs-4",
    name: "Standing Calf Raises",
    category: "Legs",
    pic: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400&auto=format&fit=crop&q=80",
  },

  // Shoulders
  {
    id: "shoulders-1",
    name: "Overhead Military Press",
    category: "Shoulders",
    pic: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "shoulders-2",
    name: "Dumbbell Lateral Raise",
    category: "Shoulders",
    pic: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "shoulders-3",
    name: "Rear Delt Face Pulls",
    category: "Shoulders",
    pic: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&auto=format&fit=crop&q=80",
  },

  // Arms
  {
    id: "arms-1",
    name: "Barbell Bicep Curl",
    category: "Arms",
    pic: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "arms-2",
    name: "Tricep Rope Pushdown",
    category: "Arms",
    pic: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "arms-3",
    name: "Hammer Curls",
    category: "Arms",
    pic: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80",
  },

  // Core
  {
    id: "core-1",
    name: "Hanging Leg Raises",
    category: "Core",
    pic: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "core-2",
    name: "Cable Woodchoppers",
    category: "Core",
    pic: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80",
  },
];

/**
 * Helper to fetch exercises from your API.
 * Modify this function with your API endpoint and keys when ready.
 */
export async function fetchCatalogExercises(): Promise<CatalogExercise[]> {
  try {
    // If you have a custom external API URL or internal route:
    if (process.env.NEXT_PUBLIC_EXERCISES_API_URL) {
      const res = await fetch(process.env.NEXT_PUBLIC_EXERCISES_API_URL, {
        headers: {
          "Content-Type": "application/json",
          // Add API Key header here if required (e.g. 'X-Api-Key': '...')
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Adapt format if data is under a nested key (e.g. data.results or data.exercises)
        const items = Array.isArray(data) ? data : data.results || data.exercises || [];
        return items.map((item: any) => ({
          id: String(item.id || item._id || item.name),
          name: item.name,
          category: item.category || item.bodyPart || item.muscle || "General",
          pic: item.pic || item.image || item.gifUrl || item.imageUrl || "",
        }));
      }
    }
  } catch (error) {
    console.warn("Could not fetch exercises from external API, falling back to catalog.", error);
  }

  // Return default catalog exercises
  return MOCK_CATALOG_EXERCISES;
}
