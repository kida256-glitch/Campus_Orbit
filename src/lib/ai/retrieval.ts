import "server-only";

import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/utils";
import type { Profile } from "@/lib/auth";
import type {
  PortfolioExperience,
  PortfolioSkill,
  PortfolioStats,
} from "@/lib/queries/student";

/**
 * The retrieval half of CampusOrbit AI.
 *
 * Everything the assistant can say is assembled here, from the signed-in
 * student's own rows, read through their session — so RLS decides what may
 * enter the context in the first place. There is no vector store and no
 * embedding step: the corpus for one student is small and fully structured, so
 * scoped SQL retrieves more accurately than similarity search would.
 */
export interface RetrievalContext {
  profile: {
    fullName: string;
    university: string;
    interests: string[];
    declaredSkills: string[];
  };
  stats: PortfolioStats | null;
  completion: number;
  skills: PortfolioSkill[];
  experience: PortfolioExperience[];
  upcomingEvents: {
    id: string;
    title: string;
    date: string;
    category: string;
    organizer: string;
    location: string;
    myStatus: string | null;
  }[];
  myEvents: {
    title: string;
    date: string;
    category: string;
    status: string;
  }[];
  recommendations: {
    id: string;
    title: string;
    organization: string;
    type: string;
    deadline: string | null;
    matched: string[];
    score: number;
  }[];
  pipeline: {
    title: string;
    type: string;
    status: string;
    deadline: string | null;
  }[];
  certifications: {
    name: string;
    provider: string;
    status: string;
    skills: string[];
  }[];
  catalogCertifications: { name: string; provider: string; skills: string[] }[];
}

export async function buildRetrievalContext(
  profile: Profile,
): Promise<RetrievalContext> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    statsResult,
    completionResult,
    skillsResult,
    experienceResult,
    eventsResult,
    registrationsResult,
    recommendationsResult,
    progressResult,
    certificationsResult,
    catalogResult,
  ] = await Promise.all([
    supabase.rpc("portfolio_stats", { target: profile.id }),
    supabase.rpc("profile_completion", { target: profile.id }),
    supabase.rpc("portfolio_skills", { target: profile.id }),
    supabase.rpc("portfolio_experience", { target: profile.id }),
    supabase
      .from("events")
      .select("id, title, date, category, organizer, location")
      .eq("status", "approved")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(12),
    supabase
      .from("event_registrations")
      .select("status, events(title, date, category)")
      .eq("student_id", profile.id),
    supabase.rpc("recommended_opportunities", {
      target: profile.id,
      max_rows: 8,
    }),
    supabase
      .from("opportunity_progress")
      .select("status, opportunities(title, type, deadline)")
      .eq("student_id", profile.id),
    supabase
      .from("student_certifications")
      .select("name, provider, status, skills")
      .eq("student_id", profile.id),
    supabase.from("certifications").select("name, provider, skills").limit(20),
  ]);

  const registrations = registrationsResult.data ?? [];

  const statusByTitle = new Map(
    registrations
      .filter((row) => row.events)
      .map((row) => [
        (row.events as { title: string }).title,
        row.status as string,
      ]),
  );

  return {
    profile: {
      fullName: profile.full_name,
      university: profile.university,
      interests: profile.interests ?? [],
      declaredSkills: profile.skills ?? [],
    },
    stats: (statsResult.data ?? null) as unknown as PortfolioStats | null,
    completion: (completionResult.data ?? 0) as number,
    skills: (skillsResult.data ?? []) as PortfolioSkill[],
    experience: (experienceResult.data ?? []) as PortfolioExperience[],
    upcomingEvents: (eventsResult.data ?? []).map((event) => ({
      ...event,
      category: event.category as string,
      myStatus: statusByTitle.get(event.title) ?? null,
    })),
    myEvents: registrations
      .filter((row) => row.events)
      .map((row) => {
        const event = row.events as {
          title: string;
          date: string;
          category: string;
        };
        return {
          title: event.title,
          date: event.date,
          category: event.category,
          status: row.status as string,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
    recommendations: (recommendationsResult.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      organization: row.organization,
      type: row.type as string,
      deadline: row.deadline,
      matched: row.matched ?? [],
      score: row.score ?? 0,
    })),
    pipeline: (progressResult.data ?? [])
      .filter((row) => row.opportunities)
      .map((row) => {
        const opportunity = row.opportunities as {
          title: string;
          type: string;
          deadline: string | null;
        };
        return {
          title: opportunity.title,
          type: opportunity.type,
          status: row.status as string,
          deadline: opportunity.deadline,
        };
      }),
    certifications: (certificationsResult.data ?? []).map((cert) => ({
      name: cert.name,
      provider: cert.provider,
      status: cert.status as string,
      skills: cert.skills,
    })),
    catalogCertifications: catalogResult.data ?? [],
  };
}

/**
 * Renders the context as compact plain text for the model prompt.
 *
 * Deliberately explicit about absence ("none recorded"), because a model given
 * a silent gap tends to invent something to fill it.
 */
export function renderContextForPrompt(context: RetrievalContext): string {
  const lines: string[] = [];

  lines.push(`STUDENT: ${context.profile.fullName}`);
  lines.push(`UNIVERSITY: ${context.profile.university}`);
  lines.push(
    `STATED INTERESTS: ${context.profile.interests.join(", ") || "none recorded"}`,
  );
  lines.push(
    `SELF-DECLARED SKILLS: ${context.profile.declaredSkills.join(", ") || "none recorded"}`,
  );
  lines.push(`PROFILE COMPLETION: ${context.completion}%`);

  const stats = context.stats;
  if (stats) {
    lines.push(
      `EVIDENCE TOTALS: ${stats.verified_events} verified events, ${stats.opportunities_completed} completed opportunities, ${stats.certifications_completed} completed certifications, ${stats.hackathons} hackathons, ${stats.workshops} workshops, ${stats.community_activities} community activities, ${stats.skills} evidence-backed skills.`,
    );
    lines.push(
      `IN FLIGHT: ${stats.opportunities_in_progress} opportunities in progress, ${stats.opportunities_saved} saved, ${stats.certifications_in_progress} certifications in progress.`,
    );
  } else {
    lines.push("EVIDENCE TOTALS: none recorded");
  }

  lines.push("");
  lines.push("VERIFIED SKILLS (skill | verified evidence count | sources):");
  const verified = context.skills.filter((skill) => skill.verified_count > 0);
  if (verified.length === 0) {
    lines.push("  none recorded");
  } else {
    for (const skill of verified) {
      lines.push(
        `  ${skill.skill} | ${skill.verified_count} | ${skill.sources.join(", ")}`,
      );
    }
  }

  lines.push("");
  lines.push("VERIFIED EXPERIENCE:");
  if (context.experience.length === 0) {
    lines.push("  none recorded");
  } else {
    for (const item of context.experience) {
      lines.push(
        `  [${item.kind}] ${item.title} — ${item.subtitle} (${item.category}, ${item.occurred_on ?? "date unknown"})`,
      );
    }
  }

  lines.push("");
  lines.push("MY EVENT HISTORY (including unverified):");
  if (context.myEvents.length === 0) {
    lines.push("  none recorded");
  } else {
    for (const event of context.myEvents) {
      lines.push(
        `  ${event.title} (${event.category}, ${event.date}) — status: ${event.status}`,
      );
    }
  }

  lines.push("");
  lines.push("UPCOMING APPROVED EVENTS:");
  if (context.upcomingEvents.length === 0) {
    lines.push("  none recorded");
  } else {
    for (const event of context.upcomingEvents) {
      const days = daysUntil(event.date);
      lines.push(
        `  ${event.title} — ${event.category}, ${event.date} (in ${days} days), ${event.location}, by ${event.organizer}${event.myStatus ? `, my status: ${event.myStatus}` : ""}`,
      );
    }
  }

  lines.push("");
  lines.push("RECOMMENDED OPPORTUNITIES (ranked by the database):");
  if (context.recommendations.length === 0) {
    lines.push("  none recorded");
  } else {
    for (const rec of context.recommendations) {
      lines.push(
        `  ${rec.title} — ${rec.organization} (${rec.type}), deadline ${rec.deadline ?? "rolling"}, matches: ${rec.matched.join(", ") || "no direct skill match"}`,
      );
    }
  }

  lines.push("");
  lines.push("MY OPPORTUNITY PIPELINE:");
  if (context.pipeline.length === 0) {
    lines.push("  none recorded");
  } else {
    for (const item of context.pipeline) {
      lines.push(
        `  ${item.title} (${item.type}) — ${item.status}, deadline ${item.deadline ?? "rolling"}`,
      );
    }
  }

  lines.push("");
  lines.push("MY CERTIFICATIONS:");
  if (context.certifications.length === 0) {
    lines.push("  none recorded");
  } else {
    for (const cert of context.certifications) {
      lines.push(`  ${cert.name} — ${cert.provider} (${cert.status})`);
    }
  }

  lines.push("");
  lines.push("CERTIFICATION CATALOG AVAILABLE ON CAMPUSORBIT:");
  for (const cert of context.catalogCertifications) {
    lines.push(
      `  ${cert.name} — ${cert.provider} (skills: ${cert.skills.join(", ")})`,
    );
  }

  return lines.join("\n");
}
