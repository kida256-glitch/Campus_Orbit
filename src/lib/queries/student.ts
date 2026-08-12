import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EventCardData } from "@/components/shared/event-card";
import type { OpportunityCardData } from "@/components/shared/opportunity-card";
import type { RegistrationStatus } from "@/lib/constants";

export interface PortfolioStats {
  verified_events: number;
  events_registered: number;
  certifications_completed: number;
  certifications_in_progress: number;
  opportunities_completed: number;
  opportunities_in_progress: number;
  opportunities_saved: number;
  hackathons: number;
  workshops: number;
  community_activities: number;
  skills: number;
  top_categories: { category: string; count: number }[];
}

export interface PortfolioSkill {
  skill: string;
  evidence_count: number;
  verified_count: number;
  sources: string[];
}

export interface PortfolioExperience {
  kind: "event" | "opportunity";
  title: string;
  subtitle: string;
  category: string;
  occurred_on: string | null;
  verified: boolean;
  reference_id: string;
}

/**
 * Everything the student dashboard needs, in one pass.
 *
 * All aggregation happens in Postgres (`portfolio_stats`, `portfolio_skills`,
 * `recommended_opportunities`) so the dashboard stays a handful of round trips
 * regardless of how much activity a student accumulates.
 */
export async function getStudentDashboard(studentId: string) {
  const supabase = await createClient();

  const [
    statsResult,
    completionResult,
    skillsResult,
    upcomingResult,
    myRegistrationsResult,
    recommendationsResult,
    certificationsResult,
  ] = await Promise.all([
    supabase.rpc("portfolio_stats", { target: studentId }),
    supabase.rpc("profile_completion", { target: studentId }),
    supabase.rpc("portfolio_skills", { target: studentId }),
    // Upcoming approved events, soonest first.
    supabase
      .from("events")
      .select(
        "id, title, date, start_time, end_time, location, category, banner_image, organizer",
      )
      .eq("status", "approved")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(6),
    supabase
      .from("event_registrations")
      .select("event_id, status")
      .eq("student_id", studentId),
    supabase.rpc("recommended_opportunities", {
      target: studentId,
      max_rows: 4,
    }),
    supabase
      .from("student_certifications")
      .select("*")
      .eq("student_id", studentId)
      .order("completion_date", { ascending: false, nullsFirst: false })
      .limit(4),
  ]);

  const registrationByEvent = new Map<string, RegistrationStatus>(
    (myRegistrationsResult.data ?? []).map((row) => [
      row.event_id,
      row.status as RegistrationStatus,
    ]),
  );

  return {
    stats: (statsResult.data ?? null) as unknown as PortfolioStats | null,
    completion: (completionResult.data ?? 0) as number,
    skills: (skillsResult.data ?? []) as PortfolioSkill[],
    upcomingEvents: (upcomingResult.data ?? []) as EventCardData[],
    registrationByEvent,
    recommendations: (recommendationsResult.data ?? []) as (OpportunityCardData & {
      score: number;
      matched: string[];
    })[],
    certifications: certificationsResult.data ?? [],
  };
}

/** Verified experience timeline plus derived skills, for the portfolio pages. */
export async function getPortfolioData(studentId: string) {
  const supabase = await createClient();

  const [stats, skills, experience, certifications, visibility] =
    await Promise.all([
      supabase.rpc("portfolio_stats", { target: studentId }),
      supabase.rpc("portfolio_skills", { target: studentId }),
      supabase.rpc("portfolio_experience", { target: studentId }),
      supabase
        .from("student_certifications")
        .select("*")
        .eq("student_id", studentId)
        .order("completion_date", { ascending: false, nullsFirst: false }),
      supabase
        .from("portfolio_visibility")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle(),
    ]);

  return {
    stats: (stats.data ?? null) as unknown as PortfolioStats | null,
    skills: (skills.data ?? []) as PortfolioSkill[],
    experience: (experience.data ?? []) as PortfolioExperience[],
    certifications: certifications.data ?? [],
    visibility: visibility.data,
  };
}
