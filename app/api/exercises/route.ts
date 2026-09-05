import { NextResponse } from "next/server";
import { MOCK_CATALOG_EXERCISES } from "@/lib/exercise-api";

/**
 * GET /api/exercises
 * You can easily point this route or replace its logic with your third-party API.
 */
export async function GET() {
  try {
    // If you have an external API endpoint configured:
    const externalApiUrl = process.env.EXERCISES_API_URL;
    if (externalApiUrl) {
      const response = await fetch(externalApiUrl, {
        headers: {
          "Content-Type": "application/json",
          // Pass API keys or auth headers if needed:
          // "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    }

    // Default fallback exercises catalog
    return NextResponse.json(MOCK_CATALOG_EXERCISES);
  } catch (error) {
    return NextResponse.json(MOCK_CATALOG_EXERCISES);
  }
}
