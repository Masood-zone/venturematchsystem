import { activeProgrammeNames } from "@/services/academic-programmes";
import { connection } from "next/server";
export async function GET() {
  await connection();
  try {
    const programmes = await activeProgrammeNames();
    if (!programmes.length) throw new Error("Programme catalogue empty.");
    return Response.json(
      { programmes },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Programmes are unavailable. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
