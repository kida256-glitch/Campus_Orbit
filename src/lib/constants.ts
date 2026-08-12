/**
 * CampusOrbit domain vocabulary.
 *
 * These lists mirror the Postgres enums defined in the migrations. Keeping them
 * in one place means the UI, validation schemas and seed data cannot drift apart.
 */

export const APP_NAME = "CampusOrbit";
export const APP_TAGLINE =
  "Your campus life. Your opportunities. Your proof.";
export const APP_DESCRIPTION =
  "CampusOrbit brings campus tech events, opportunities, certifications and communities into one place — then automatically turns your participation into a career portfolio.";
export const DEFAULT_UNIVERSITY = "";

export const ROLES = ["student", "community_leader", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** Roles a user may pick during signup. Admin is provisioned, never self-selected. */
export const SIGNUP_ROLES = ["student", "community_leader"] as const;

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  community_leader: "Community Leader",
  admin: "Admin",
};

export const EVENT_CATEGORIES = [
  "AI",
  "Web3",
  "Cloud",
  "Software Development",
  "Data",
  "Cybersecurity",
  "Design",
  "Entrepreneurship",
  "Career",
  "Other",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "completed",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/**
 * Attendance ladder. Only `verified` feeds the portfolio — "attending" is a
 * student's own claim and is deliberately not treated as proof.
 */
export const REGISTRATION_STATUSES = [
  "interested",
  "registered",
  "attended",
  "verified",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const OPPORTUNITY_TYPES = [
  "Internship",
  "Fellowship",
  "Hackathon",
  "Scholarship",
  "Certification",
  "Competition",
  "Grant",
  "Course",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_STATUSES = ["draft", "published", "archived"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const PROGRESS_STATUSES = [
  "saved",
  "in_progress",
  "completed",
] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const CERTIFICATION_STATUSES = ["in_progress", "completed"] as const;
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

export const MARKETPLACE_CATEGORIES = [
  "Laptops",
  "Phones",
  "Accessories",
  "Networking Equipment",
  "Software",
  "Other",
] as const;
export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export const LISTING_CONDITIONS = [
  "new",
  "like_new",
  "good",
  "fair",
] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
};

export const MODERATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const CONTACT_METHODS = ["whatsapp", "phone", "email"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const NOTIFICATION_TYPES = [
  "event_approved",
  "event_rejected",
  "event_reminder",
  "attendance_verified",
  "opportunity_deadline",
  "portfolio_updated",
  "seller_approved",
  "seller_rejected",
  "listing_approved",
  "listing_removed",
  "role_changed",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Interests offered during onboarding; they drive dashboard recommendations. */
export const INTEREST_OPTIONS = [
  "AI",
  "Machine Learning",
  "Web3",
  "Blockchain",
  "Cloud Computing",
  "DevOps",
  "Software Development",
  "Mobile Development",
  "Data Science",
  "Data Analytics",
  "Cybersecurity",
  "UI/UX Design",
  "Product Management",
  "Entrepreneurship",
  "Open Source",
  "Robotics",
] as const;

/** Skill vocabulary shared by profiles, opportunities and certifications. */
export const SKILL_OPTIONS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "SQL",
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "Solidity",
  "Smart Contracts",
  "Machine Learning",
  "Deep Learning",
  "Data Visualisation",
  "Power BI",
  "Figma",
  "Git",
  "Linux",
  "Networking",
  "Penetration Testing",
  "Technical Writing",
  "Public Speaking",
  "Community Building",
  "Project Management",
] as const;

/** Category → skills, used to derive portfolio skill evidence from events. */
export const CATEGORY_SKILL_MAP: Record<EventCategory, string[]> = {
  AI: ["Machine Learning", "Python", "Deep Learning"],
  Web3: ["Solidity", "Smart Contracts", "Blockchain"],
  Cloud: ["AWS", "Cloud Computing", "Docker"],
  "Software Development": ["JavaScript", "Git", "React"],
  Data: ["SQL", "Data Visualisation", "Python"],
  Cybersecurity: ["Networking", "Penetration Testing", "Linux"],
  Design: ["Figma", "UI/UX Design"],
  Entrepreneurship: ["Project Management", "Public Speaking"],
  Career: ["Technical Writing", "Public Speaking"],
  Other: ["Community Building"],
};

/** Suggested prompts shown on the CampusOrbit AI page. */
export const AI_SUGGESTED_PROMPTS = [
  "What's coming up for me?",
  "Recommend opportunities",
  "Analyze my portfolio",
  "What skill should I learn next?",
] as const;
