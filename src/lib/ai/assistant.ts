import "server-only";

import { daysUntil, listPhraseSafe } from "@/lib/ai/utils";
import {
  type RetrievalContext,
  renderContextForPrompt,
} from "@/lib/ai/retrieval";

export interface AssistantReply {
  answer: string;
  /** Which retrieved sections the answer drew on, surfaced in the UI. */
  sources: string[];
  /** True when the deterministic reasoner produced the answer. */
  grounded: boolean;
}

const SYSTEM_PROMPT = `You are CampusOrbit AI, an assistant inside a campus technology platform for students at schools, universities and colleges.

Hard rules:
- Answer ONLY from the CONTEXT block. It is the student's real CampusOrbit data.
- If the context says "none recorded" for something, say plainly that there is nothing recorded yet. Never invent events, opportunities, certifications, skills or dates.
- Never claim an activity is verified unless the context marks it verified.
- Distinguish "registered" (the student's own claim) from "verified" (attested by an organiser). Only verified activity is portfolio evidence.
- Be concise: 2 short paragraphs maximum, or a tight list. No preamble.
- Refer to specific titles and dates from the context when relevant.
- When recommending, explain briefly why it matches the student's evidence or interests.
- You cannot perform actions. You may point to pages: /events, /opportunities, /portfolio, /discover, /profile.`;

/**
 * Answers a student's question about their own CampusOrbit activity.
 *
 * Two paths, same retrieval context:
 *   1. A configured LLM provider (OpenAI or Groq), prompted with the context
 *      and instructed not to go beyond it.
 *   2. The built-in deterministic reasoner, which composes answers directly
 *      from the retrieved rows.
 *
 * Path 2 is the default so the product works with zero external services and
 * cannot hallucinate at all. Both refuse to answer beyond the retrieved data.
 */
export async function answerQuestion(
  question: string,
  context: RetrievalContext,
): Promise<AssistantReply> {
  const provider = process.env.CAMPUSORBIT_AI_PROVIDER ?? "none";
  const apiKey =
    provider === "openai"
      ? process.env.OPENAI_API_KEY
      : provider === "groq"
        ? process.env.GROQ_API_KEY
        : undefined;

  if (provider !== "none" && apiKey) {
    try {
      const answer = await callModel(question, context, provider, apiKey);
      if (answer) {
        return { answer, sources: sourcesFor(question, context), grounded: false };
      }
    } catch {
      // Fall through to the deterministic reasoner rather than failing the
      // request — the demo must never depend on an external service.
    }
  }

  return groundedAnswer(question, context);
}

async function callModel(
  question: string,
  context: RetrievalContext,
  provider: string,
  apiKey: string,
): Promise<string | null> {
  const endpoint =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  const model =
    process.env.CAMPUSORBIT_AI_MODEL ??
    (provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `CONTEXT\n=======\n${renderContextForPrompt(context)}\n\nQUESTION\n========\n${question}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// Deterministic grounded reasoner
// ---------------------------------------------------------------------------

type Intent =
  | "upcoming"
  | "recommend"
  | "portfolio"
  | "next_skill"
  | "certifications"
  | "achievements"
  | "attended"
  | "search"
  | "help";

function classify(question: string): Intent {
  const q = question.toLowerCase();

  // An explicit search verb wins over every topical keyword. "Find me Web3
  // opportunities" is a lookup, not a request for general recommendations,
  // and conflating the two made the assistant answer a different question.
  if (/\b(find|search for|show me|look for|are there any|is there any)\b/.test(q))
    return "search";

  if (/(coming up|upcoming|this week|next week|what.*on|happening)/.test(q))
    return "upcoming";
  if (/(recommend|suggest|match|opportunit)/.test(q) && !/complete/.test(q))
    return "recommend";
  if (/(portfolio|how strong|analy[sz]e|cv|resume)/.test(q)) return "portfolio";
  if (/(what should i learn|skill.*next|learn next|improve|focus on next|focus)/.test(q))
    return "next_skill";
  if (/(certification|certificate|cert\b)/.test(q)) return "certifications";
  if (/(achiev|accomplish|so far|progress|done)/.test(q)) return "achievements";
  if (/(attended|been to|events i|my events|verified)/.test(q)) return "attended";
  if (/(find|show|search|any)\b/.test(q)) return "search";

  return "help";
}

/** Dropped when deriving search terms from an unrecognised question. */
const STOPWORDS = new Set([
  "find",
  "search",
  "show",
  "look",
  "there",
  "any",
  "some",
  "give",
  "tell",
  "about",
  "with",
  "that",
  "this",
  "these",
  "those",
  "from",
  "have",
  "what",
  "which",
  "would",
  "could",
  "should",
  "please",
  "opportunity",
  "opportunities",
  "event",
  "events",
  "campusorbit",
]);

/** Topic keywords used by the "find me X" intent. */
const TOPICS = [
  "ai",
  "machine learning",
  "web3",
  "blockchain",
  "cloud",
  "aws",
  "azure",
  "google cloud",
  "data",
  "sql",
  "cybersecurity",
  "security",
  "design",
  "figma",
  "react",
  "typescript",
  "python",
  "internship",
  "hackathon",
  "scholarship",
  "fellowship",
  "grant",
];

function groundedAnswer(
  question: string,
  context: RetrievalContext,
): AssistantReply {
  const intent = classify(question);
  const firstName = context.profile.fullName.split(" ")[0];
  const stats = context.stats;
  const verifiedSkills = context.skills.filter((s) => s.verified_count > 0);

  switch (intent) {
    case "upcoming": {
      if (context.upcomingEvents.length === 0) {
        return reply(
          "There are no approved upcoming events on CampusOrbit right now. Once a community submits one and a moderator approves it, it will show up on your dashboard and in /events.",
          ["Upcoming events"],
        );
      }

      const soon = context.upcomingEvents.slice(0, 5);
      const lines = soon.map((event) => {
        const days = daysUntil(event.date);
        const when =
          days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
        const mine = event.myStatus
          ? ` — you're ${event.myStatus === "registered" ? "registered" : event.myStatus}`
          : "";
        return `• ${event.title} (${event.category}) — ${when}, ${event.location}${mine}`;
      });

      const unregistered = soon.filter((event) => !event.myStatus);

      return reply(
        `Here's what's coming up for you, ${firstName}:\n\n${lines.join("\n")}\n\n${
          unregistered.length > 0
            ? `You haven't registered for ${unregistered.length} of these yet. Registering is your own claim — the organiser still verifies attendance afterwards, and only that verification becomes portfolio evidence.`
            : "You're already registered for everything upcoming."
        }`,
        ["Upcoming events", "My registrations"],
      );
    }

    case "recommend": {
      if (context.recommendations.length === 0) {
        return reply(
          `There are no open opportunities matching your profile right now, ${firstName}. Adding more interests on /profile widens the matching, and new opportunities are published by moderators regularly.`,
          ["Recommended opportunities"],
        );
      }

      const top = context.recommendations.slice(0, 4);
      const lines = top.map((rec) => {
        const why =
          rec.matched.length > 0
            ? `matches your ${listPhraseSafe(rec.matched.slice(0, 3))}`
            : "broadly relevant to your interests";
        const closes =
          rec.deadline !== null
            ? `closes in ${daysUntil(rec.deadline)} days`
            : "rolling deadline";
        return `• ${rec.title} — ${rec.organization} (${rec.type}); ${why}; ${closes}`;
      });

      return reply(
        `Based on your interests and the skills you've already evidenced:\n\n${lines.join("\n")}\n\nThese are ranked by the database against your verified skills first, then your declared skills and interests. Open /opportunities to save or start any of them.`,
        ["Recommended opportunities", "Verified skills"],
      );
    }

    case "portfolio": {
      if (!stats) {
        return reply(
          "I can't read your portfolio statistics right now. Try reloading /portfolio.",
          [],
        );
      }

      const evidence =
        stats.verified_events +
        stats.opportunities_completed +
        stats.certifications_completed;

      if (evidence === 0) {
        return reply(
          `Your portfolio is empty so far, ${firstName} — that's normal for a new account, and it's honest rather than padded.\n\nTo put the first evidence on it: register for an event in /events, attend it, and ask the organiser to verify you. Verified attendance, completed opportunities and completed certifications are the three things that become evidence. Your profile is ${context.completion}% complete, which also affects how well recommendations match you.`,
          ["Evidence totals", "Profile completion"],
        );
      }

      const strength =
        evidence >= 8
          ? "genuinely strong for a student portfolio"
          : evidence >= 4
            ? "solid and clearly developing"
            : "early but real";

      const topThree = verifiedSkills.slice(0, 3).map((s) => s.skill);
      const domains = (stats.top_categories ?? []).map((c) => c.category);

      const gaps: string[] = [];
      if (stats.certifications_completed === 0)
        gaps.push("no completed certification yet");
      if (stats.hackathons === 0) gaps.push("no hackathon on record");
      if (verifiedSkills.length < 4)
        gaps.push("only a few skills have verified backing");

      return reply(
        `Your portfolio is ${strength}: ${stats.verified_events} verified ${stats.verified_events === 1 ? "event" : "events"}, ${stats.opportunities_completed} completed ${stats.opportunities_completed === 1 ? "opportunity" : "opportunities"} and ${stats.certifications_completed} ${stats.certifications_completed === 1 ? "certification" : "certifications"}, producing ${stats.skills} evidence-backed ${stats.skills === 1 ? "skill" : "skills"}.${
          domains.length > 0
            ? ` Your activity clusters around ${listPhraseSafe(domains)}.`
            : ""
        }${topThree.length > 0 ? ` The strongest evidence sits behind ${listPhraseSafe(topThree)}.` : ""}\n\n${
          gaps.length > 0
            ? `Where it's thin: ${listPhraseSafe(gaps)}. Closing any one of those would visibly strengthen it.`
            : "There are no obvious gaps — keep the cadence up."
        } Your profile is ${context.completion}% complete.`,
        ["Evidence totals", "Verified skills", "Profile completion"],
      );
    }

    case "next_skill": {
      const demonstrated = new Set(verifiedSkills.map((s) => s.skill));
      const interests = context.profile.interests;

      // Prefer a skill the student says they care about but has no evidence for,
      // and that an actual open opportunity would exercise.
      const gapFromRecommendations = context.recommendations
        .flatMap((rec) => rec.matched)
        .filter((skill) => !demonstrated.has(skill));

      const declaredGap = context.profile.declaredSkills.filter(
        (skill) => !demonstrated.has(skill),
      );

      const candidate =
        gapFromRecommendations[0] ?? declaredGap[0] ?? interests[0] ?? null;

      if (!candidate) {
        return reply(
          `You haven't recorded interests or skills yet, ${firstName}, so I'd be guessing. Add a few on /profile and I can point at a specific next step backed by what's actually on the platform.`,
          ["Stated interests"],
        );
      }

      const route = context.recommendations.find((rec) =>
        rec.matched.includes(candidate),
      );
      const event = context.upcomingEvents.find((e) =>
        e.category.toLowerCase().includes(candidate.toLowerCase()),
      );
      const cert = context.catalogCertifications.find((c) =>
        c.skills.includes(candidate),
      );

      const paths: string[] = [];
      if (route)
        paths.push(
          `• ${route.title} (${route.organization}) would exercise it directly`,
        );
      if (event)
        paths.push(`• ${event.title} on ${event.date} covers this area`);
      if (cert)
        paths.push(`• ${cert.name} from ${cert.provider} would certify it`);

      return reply(
        `I'd focus on ${candidate} next.${
          demonstrated.size > 0
            ? ` You already have verified evidence for ${listPhraseSafe([...demonstrated].slice(0, 3))}, but nothing yet backing ${candidate}`
            : ` You have no verified evidence yet, so ${candidate} is a clean place to start`
        }${context.profile.interests.includes(candidate) ? ", and you listed it as an interest" : ""}.\n\n${
          paths.length > 0
            ? `Concrete routes on CampusOrbit right now:\n${paths.join("\n")}`
            : "There is nothing on the platform targeting it at the moment — worth checking /discover again in a week."
        }`,
        ["Verified skills", "Recommended opportunities", "Certification catalog"],
      );
    }

    case "certifications": {
      const completed = context.certifications.filter(
        (c) => c.status === "completed",
      );
      const inProgress = context.certifications.filter(
        (c) => c.status === "in_progress",
      );

      const owned = new Set(context.certifications.map((c) => c.name));
      const demonstrated = new Set(verifiedSkills.map((s) => s.skill));

      // Suggest catalog entries that build on evidence the student already has.
      const suggestions = context.catalogCertifications
        .filter((cert) => !owned.has(cert.name))
        .map((cert) => ({
          cert,
          overlap: cert.skills.filter((skill) => demonstrated.has(skill)).length,
        }))
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 3);

      const parts: string[] = [];

      if (completed.length > 0) {
        parts.push(
          `You've completed ${completed.length}: ${listPhraseSafe(completed.map((c) => `${c.name} (${c.provider})`))}.`,
        );
      } else {
        parts.push("You have no completed certifications recorded yet.");
      }

      if (inProgress.length > 0) {
        parts.push(
          `In progress: ${listPhraseSafe(inProgress.map((c) => c.name))}.`,
        );
      }

      if (suggestions.length > 0) {
        parts.push(
          `\nFrom the CampusOrbit catalog, these line up best with what you've already evidenced:\n${suggestions
            .map(
              (s) =>
                `• ${s.cert.name} — ${s.cert.provider}${s.overlap > 0 ? ` (builds on your verified ${listPhraseSafe(s.cert.skills.filter((k) => demonstrated.has(k)))})` : ""}`,
            )
            .join("\n")}`,
        );
      }

      return reply(parts.join(" "), [
        "My certifications",
        "Certification catalog",
        "Verified skills",
      ]);
    }

    case "achievements": {
      if (!stats) return reply("I can't read your activity totals right now.", []);

      const items: string[] = [];
      if (stats.verified_events > 0)
        items.push(`${stats.verified_events} verified events`);
      if (stats.certifications_completed > 0)
        items.push(`${stats.certifications_completed} certifications completed`);
      if (stats.opportunities_completed > 0)
        items.push(`${stats.opportunities_completed} opportunities completed`);
      if (stats.hackathons > 0) items.push(`${stats.hackathons} hackathons`);
      if (stats.workshops > 0) items.push(`${stats.workshops} workshops`);
      if (stats.community_activities > 0)
        items.push(`${stats.community_activities} community activities`);

      if (items.length === 0) {
        return reply(
          `Nothing is recorded on your CampusOrbit account yet, ${firstName}. That changes the first time an organiser verifies your attendance at an event, or you mark an opportunity or certification complete.`,
          ["Evidence totals"],
        );
      }

      return reply(
        `So far on CampusOrbit: ${listPhraseSafe(items)}.\n\nThat produces ${stats.skills} evidence-backed ${stats.skills === 1 ? "skill" : "skills"} on your portfolio. Everything here is drawn from records someone else attested to or that you completed — none of it is self-described.`,
        ["Evidence totals", "Verified experience"],
      );
    }

    case "attended": {
      const verified = context.myEvents.filter((e) => e.status === "verified");
      const pending = context.myEvents.filter(
        (e) => e.status === "attended" || e.status === "registered",
      );

      if (context.myEvents.length === 0) {
        return reply(
          `You have no event history yet, ${firstName}. Browse /events and register for something — after the event the organiser verifies who took part.`,
          ["My event history"],
        );
      }

      const parts: string[] = [];

      if (verified.length > 0) {
        parts.push(
          `Verified attendance (${verified.length}):\n${verified
            .map((e) => `• ${e.title} — ${e.category}, ${e.date}`)
            .join("\n")}`,
        );
      } else {
        parts.push("You have no verified attendance yet.");
      }

      if (pending.length > 0) {
        parts.push(
          `\nNot yet verified (${pending.length}):\n${pending
            .map((e) => `• ${e.title} — ${e.date} (${e.status})`)
            .join("\n")}\n\nOnly the verified ones count towards your portfolio.`,
        );
      }

      return reply(parts.join("\n"), ["My event history"]);
    }

    case "search": {
      const q = question.toLowerCase();

      // Prefer a known topic, but fall back to the question's own content words
      // so an unknown subject still gets an honest "nothing recorded" rather
      // than a request to rephrase.
      const known = TOPICS.find((t) => q.includes(t));
      const terms = known
        ? [known]
        : q
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((word) => word.length > 3 && !STOPWORDS.has(word));

      const subject = known ?? terms.join(" ").trim();

      const hits = (haystack: string) =>
        terms.some((term) => haystack.toLowerCase().includes(term));

      const matchingOpportunities = context.recommendations.filter(
        (rec) =>
          hits(rec.title) ||
          hits(rec.type) ||
          hits(rec.organization) ||
          rec.matched.some((m) => hits(m)),
      );

      const matchingEvents = context.upcomingEvents.filter(
        (event) => hits(event.title) || hits(event.category),
      );

      if (
        terms.length === 0 ||
        (matchingOpportunities.length === 0 && matchingEvents.length === 0)
      ) {
        return reply(
          `I have nothing on CampusOrbit matching${subject ? ` "${subject}"` : " that"}. I only answer from what is actually recorded here, so I won't guess at listings that don't exist. Browse /opportunities and /events for adjacent areas, or ask me to recommend something based on your evidenced skills.`,
          ["Recommended opportunities", "Upcoming events"],
        );
      }

      const parts: string[] = [];
      if (matchingOpportunities.length > 0) {
        parts.push(
          `Opportunities:\n${matchingOpportunities
            .map(
              (rec) =>
                `• ${rec.title} — ${rec.organization} (${rec.type}), deadline ${rec.deadline ?? "rolling"}`,
            )
            .join("\n")}`,
        );
      }
      if (matchingEvents.length > 0) {
        parts.push(
          `Events:\n${matchingEvents
            .map((e) => `• ${e.title} — ${e.date}, ${e.location}`)
            .join("\n")}`,
        );
      }

      return reply(
        `Here's what I found for ${subject}:\n\n${parts.join("\n\n")}`,
        ["Recommended opportunities", "Upcoming events"],
      );
    }

    default:
      return reply(
        `I can only answer from your CampusOrbit data, ${firstName} — that keeps me honest. Try asking:\n\n• What's coming up for me?\n• Recommend opportunities\n• Analyze my portfolio\n• What skill should I learn next?\n• Which certifications should I take?\n• What events have I attended?`,
        [],
      );
  }
}

function reply(answer: string, sources: string[]): AssistantReply {
  return { answer, sources, grounded: true };
}

/** Rough attribution for the model path, where we cannot inspect reasoning. */
function sourcesFor(question: string, context: RetrievalContext): string[] {
  const intent = classify(question);

  switch (intent) {
    case "upcoming":
      return ["Upcoming events", "My registrations"];
    case "recommend":
    case "search":
      return ["Recommended opportunities", "Verified skills"];
    case "portfolio":
    case "achievements":
      return ["Evidence totals", "Verified experience"];
    case "next_skill":
      return ["Verified skills", "Recommended opportunities"];
    case "certifications":
      return ["My certifications", "Certification catalog"];
    case "attended":
      return ["My event history"];
    default:
      return context.stats ? ["Evidence totals"] : [];
  }
}
