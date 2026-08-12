import { NextResponse } from "next/server";
import { z } from "zod";

import { getProfile } from "@/lib/auth";
import { buildRetrievalContext } from "@/lib/ai/retrieval";
import { answerQuestion } from "@/lib/ai/assistant";

/**
 * CampusOrbit AI endpoint.
 *
 * A route handler rather than a Server Action so the assistant is independently
 * testable over HTTP and can be upgraded to a streaming response without
 * changing the client contract.
 *
 * Authorization: requires a session, and only ever reads the caller's own data.
 * The retrieval context is built through the caller's session, so RLS decides
 * what may enter the prompt — there is no way to ask about another student.
 */
const bodySchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Ask a slightly longer question")
    .max(500, "Keep questions under 500 characters"),
});

export async function POST(request: Request) {
  const profile = await getProfile();

  if (!profile) {
    return NextResponse.json(
      { error: "You need to be signed in to use CampusOrbit AI." },
      { status: 401 },
    );
  }

  if (profile.role !== "student") {
    return NextResponse.json(
      { error: "CampusOrbit AI is available to student accounts." },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid question." },
      { status: 400 },
    );
  }

  try {
    const context = await buildRetrievalContext(profile);
    const reply = await answerQuestion(parsed.data.question, context);

    return NextResponse.json(reply);
  } catch (error) {
    console.error("CampusOrbit AI failed:", error);
    return NextResponse.json(
      {
        error:
          "CampusOrbit AI could not read your activity just now. Try again in a moment.",
      },
      { status: 500 },
    );
  }
}
