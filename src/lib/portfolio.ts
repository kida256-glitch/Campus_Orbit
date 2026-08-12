import type { PortfolioSkill, PortfolioStats } from "@/lib/queries/student";

/**
 * Proficiency is evidence-driven, not self-assessed.
 *
 * Scale: each piece of verified evidence is worth 22 points, self-declared
 * skills contribute a flat 15, and the result is capped at 96 so no skill ever
 * reads as "complete". Five verified activities therefore reach the top band,
 * which matches how much a student can realistically do in a semester.
 */
export function skillProficiency(skill: PortfolioSkill) {
  const verified = skill.verified_count * 22;
  const declared = skill.sources.includes("profile") ? 15 : 0;
  return Math.min(96, Math.max(8, verified + declared));
}

/** Ten-segment bar, matching the ████████░░ style in the product brief. */
export function skillBar(value: number, segments = 10) {
  const filled = Math.round((value / 100) * segments);
  return "█".repeat(filled) + "░".repeat(Math.max(0, segments - filled));
}

export function evidenceLabel(skill: PortfolioSkill) {
  if (skill.verified_count === 0) return "Self-declared";

  const sources = skill.sources.filter((source) => source !== "profile");
  const kinds = sources
    .map((source) =>
      source === "event"
        ? "events"
        : source === "certification"
          ? "certifications"
          : "opportunities",
    )
    .join(" and ");

  return `${skill.verified_count} verified ${skill.verified_count === 1 ? "activity" : "activities"} across ${kinds}`;
}

/**
 * Career snapshot, generated from counts rather than free text.
 *
 * Written to degrade gracefully: a brand-new student gets an honest "just
 * getting started" summary instead of invented achievements.
 */
export function careerSnapshot(
  fullName: string,
  university: string,
  stats: PortfolioStats | null,
  skills: PortfolioSkill[],
): string {
  const firstName = fullName.split(" ")[0];

  if (!stats) {
    return `${firstName} is a student at ${university} building a CampusOrbit profile.`;
  }

  const verifiedSkills = skills.filter((skill) => skill.verified_count > 0);
  const totalEvidence =
    stats.verified_events +
    stats.certifications_completed +
    stats.opportunities_completed;

  if (totalEvidence === 0) {
    return `${firstName} is a student at ${university} starting out on CampusOrbit. No verified activity has been recorded yet — participation in events and opportunities will appear here automatically as evidence.`;
  }

  const topSkills = verifiedSkills.slice(0, 3).map((skill) => skill.skill);
  const domains = (stats.top_categories ?? [])
    .slice(0, 3)
    .map((entry) => entry.category);

  const sentences: string[] = [];

  const domainPhrase =
    domains.length > 0
      ? ` with verified experience across ${listPhrase(domains)}`
      : "";

  sentences.push(
    `${firstName} is an emerging technology builder at ${university}${domainPhrase}.`,
  );

  const evidenceParts: string[] = [];
  if (stats.verified_events > 0) {
    evidenceParts.push(
      `${stats.verified_events} verified ${stats.verified_events === 1 ? "event" : "events"}`,
    );
  }
  if (stats.certifications_completed > 0) {
    evidenceParts.push(
      `${stats.certifications_completed} completed ${stats.certifications_completed === 1 ? "certification" : "certifications"}`,
    );
  }
  if (stats.opportunities_completed > 0) {
    evidenceParts.push(
      `${stats.opportunities_completed} completed ${stats.opportunities_completed === 1 ? "opportunity" : "opportunities"}`,
    );
  }

  if (evidenceParts.length > 0) {
    sentences.push(
      `Their CampusOrbit record holds ${listPhrase(evidenceParts)}.`,
    );
  }

  const activityParts: string[] = [];
  if (stats.hackathons > 0) {
    activityParts.push(
      `${stats.hackathons} ${stats.hackathons === 1 ? "hackathon" : "hackathons"}`,
    );
  }
  if (stats.workshops > 0) {
    activityParts.push(
      `${stats.workshops} technical ${stats.workshops === 1 ? "workshop" : "workshops"}`,
    );
  }
  if (stats.community_activities > 0) {
    activityParts.push(
      `${stats.community_activities} community ${stats.community_activities === 1 ? "activity" : "activities"}`,
    );
  }

  if (activityParts.length > 0) {
    sentences.push(
      `This includes ${listPhrase(activityParts)}, evidencing consistent participation.`,
    );
  }

  if (topSkills.length > 0) {
    sentences.push(
      `Strongest demonstrated skills: ${listPhrase(topSkills)}.`,
    );
  }

  return sentences.join(" ");
}

/** "a, b and c" */
export function listPhrase(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Achievement chips shown on the portfolio. Only non-zero counts appear. */
export function achievements(stats: PortfolioStats | null) {
  if (!stats) return [];

  const entries: { label: string; value: number }[] = [
    { label: "verified events", value: stats.verified_events },
    { label: "certifications completed", value: stats.certifications_completed },
    { label: "hackathons participated in", value: stats.hackathons },
    { label: "technical workshops", value: stats.workshops },
    { label: "community activities", value: stats.community_activities },
    { label: "opportunities completed", value: stats.opportunities_completed },
    { label: "evidence-backed skills", value: stats.skills },
  ];

  return entries
    .filter((entry) => entry.value > 0)
    .map((entry) => ({
      ...entry,
      text: `${entry.value} ${entry.label}`,
    }));
}
