import { z } from "zod";

import {
  CONTACT_METHODS,
  EVENT_CATEGORIES,
  LISTING_CONDITIONS,
  MARKETPLACE_CATEGORIES,
  OPPORTUNITY_TYPES,
  SIGNUP_ROLES,
} from "@/lib/constants";

/** Shared password rule, surfaced verbatim in the signup form's helper text. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Passwords cannot exceed 72 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(120, "That name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  // Admin is deliberately absent: the database refuses it at signup anyway.
  role: z.enum(SIGNUP_ROLES),
  university: z
    .string()
    .trim()
    .max(200, "Institution name is too long")
    .optional()
    .or(z.literal("")),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const onboardingSchema = z.object({
  interests: z
    .array(z.string())
    .min(3, "Pick at least 3 interests so recommendations are useful")
    .max(12, "Pick up to 12 interests"),
  skills: z.array(z.string()).max(20, "Pick up to 20 skills").default([]),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  bio: z.string().trim().max(600, "Keep your bio under 600 characters").optional(),
  university: z
    .string()
    .trim()
    .max(200, "Institution name is too long")
    .optional()
    .or(z.literal("")),
  interests: z.array(z.string()).max(12).default([]),
  skills: z.array(z.string()).max(20).default([]),
  github: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .optional()
    .or(z.literal("")),
});

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Give the event a clear title")
      .max(160, "Keep the title under 160 characters"),
    description: z
      .string()
      .trim()
      .min(20, "Describe the event in at least 20 characters")
      .max(4000),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time"),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Choose an end time")
      .optional()
      .or(z.literal("")),
    location: z.string().trim().min(3, "Where is it happening?").max(200),
    category: z.enum(EVENT_CATEGORIES),
    organizer: z.string().trim().min(2, "Who is organising it?").max(160),
    bannerImage: z
      .string()
      .trim()
      .url("Enter a full image URL")
      .optional()
      .or(z.literal("")),
    externalRsvpUrl: z
      .string()
      .trim()
      .url("Enter a full URL, including https://")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (value) => !value.endTime || value.endTime > value.startTime,
    { message: "The end time must be after the start time", path: ["endTime"] },
  );

export const opportunitySchema = z.object({
  title: z.string().trim().min(4, "Give the opportunity a title").max(160),
  description: z.string().trim().min(20, "Add a short description").max(4000),
  organization: z.string().trim().min(2, "Who is offering it?").max(160),
  type: z.enum(OPPORTUNITY_TYPES),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a deadline")
    .optional()
    .or(z.literal("")),
  skillTags: z.array(z.string()).max(12, "Up to 12 skill tags").default([]),
  applicationUrl: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .optional()
    .or(z.literal("")),
  image: z
    .string()
    .trim()
    .url("Enter a full image URL")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
});

export const certificationSchema = z
  .object({
    name: z.string().trim().min(2, "Name the certification").max(180),
    provider: z.string().trim().min(2, "Who issues it?").max(120),
    skills: z.array(z.string()).max(12).default([]),
    startedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    completionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    credentialUrl: z
      .string()
      .trim()
      .url("Enter a full URL, including https://")
      .optional()
      .or(z.literal("")),
    status: z.enum(["in_progress", "completed"]),
  })
  .refine(
    (value) => value.status !== "completed" || !!value.completionDate,
    {
      message: "A completed certification needs a completion date",
      path: ["completionDate"],
    },
  )
  .refine(
    (value) =>
      !value.completionDate ||
      !value.startedDate ||
      value.completionDate >= value.startedDate,
    {
      message: "The completion date cannot be before the start date",
      path: ["completionDate"],
    },
  );

export const sellerApplicationSchema = z.object({
  businessName: z.string().trim().min(2, "Name your shop").max(120),
  description: z
    .string()
    .trim()
    .min(20, "Tell the moderators what you sell (at least 20 characters)")
    .max(1000),
  contactMethod: z.enum(CONTACT_METHODS),
  contactValue: z.string().trim().min(5, "Add a working contact").max(160),
});

export const listingSchema = z.object({
  productName: z.string().trim().min(3, "Name the item").max(140),
  description: z.string().trim().min(20, "Describe the item").max(2000),
  price: z.coerce
    .number({ invalid_type_error: "Enter a price" })
    .min(0, "Price cannot be negative")
    .max(1_000_000_000, "That price looks wrong"),
  condition: z.enum(LISTING_CONDITIONS),
  category: z.enum(MARKETPLACE_CATEGORIES),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a full image URL")
    .optional()
    .or(z.literal("")),
  contactMethod: z.enum(CONTACT_METHODS),
  contactValue: z.string().trim().min(5, "Add a working contact").max(160),
});

export const moderationSchema = z.object({
  id: z.string().uuid(),
  note: z.string().trim().max(600).optional(),
});

export const rejectionSchema = z.object({
  id: z.string().uuid(),
  note: z
    .string()
    .trim()
    .min(10, "Explain what needs to change so the organiser can fix it")
    .max(600),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
