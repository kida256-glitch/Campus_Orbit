"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/supabase/public";

import { requireProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listingSchema, sellerApplicationSchema } from "@/lib/validation";
import {
  type ActionState,
  fail,
  fieldErrorsFrom,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

/** Applies to become a verified seller. One application per student. */
export async function applyAsSellerAction(
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = sellerApplicationSchema.safeParse({
    businessName: formData.get("businessName"),
    description: formData.get("description"),
    contactMethod: formData.get("contactMethod"),
    contactValue: formData.get("contactValue"),
  });

  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.from("seller_applications").upsert(
    {
      student_id: profile.id,
      business_name: parsed.data.businessName,
      description: parsed.data.description,
      contact_method: parsed.data.contactMethod,
      contact_value: parsed.data.contactValue,
    },
    { onConflict: "student_id" },
  );

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/marketplace");
  revalidatePath("/admin/marketplace");

  return ok("Application submitted. An administrator will review it shortly.");
}

/**
 * Creates a listing. Only approved sellers get past the RLS check, and the
 * guard trigger forces `pending` so nothing appears before moderation.
 */
export async function createListingAction(
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = listingSchema.safeParse({
    productName: formData.get("productName"),
    description: formData.get("description"),
    price: formData.get("price"),
    condition: formData.get("condition"),
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl") ?? "",
    contactMethod: formData.get("contactMethod"),
    contactValue: formData.get("contactValue"),
  });

  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.from("marketplace_listings").insert({
    seller_id: profile.id,
    product_name: parsed.data.productName,
    description: parsed.data.description,
    price: parsed.data.price,
    condition: parsed.data.condition,
    category: parsed.data.category,
    images: parsed.data.imageUrl ? [parsed.data.imageUrl] : [],
    contact_method: parsed.data.contactMethod,
    contact_value: parsed.data.contactValue,
  });

  if (error) {
    if (error.code === "42501") {
      return fail(
        "Only approved sellers can publish listings. Apply first and wait for review.",
      );
    }
    return fail(humanizeDbError(error));
  }

  revalidateTag(CACHE_TAGS.listings);
  revalidatePath("/marketplace");
  revalidatePath("/admin/marketplace");

  return ok("Listing submitted for moderation.");
}

export async function deleteListingAction(id: string): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("marketplace_listings")
    .delete()
    .eq("id", id);

  if (error) return fail(humanizeDbError(error));

  revalidateTag(CACHE_TAGS.listings);
  revalidatePath("/marketplace");
  revalidatePath("/admin/marketplace");

  return ok("Listing removed.");
}

// ---------------------------------------------------------------------------
// Admin moderation
// ---------------------------------------------------------------------------

export async function reviewSellerAction(
  id: string,
  status: "approved" | "rejected",
  note?: string,
): Promise<ActionState> {
  await requireRole("admin");

  if (status === "rejected" && (!note || note.trim().length < 10)) {
    return fail("Explain why the application was declined (10+ characters).");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("seller_applications")
    .update({ status, review_note: note?.trim() || null })
    .eq("id", id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/admin/marketplace");
  revalidateTag(CACHE_TAGS.listings);
  revalidatePath("/marketplace");

  return ok(
    status === "approved"
      ? "Seller approved. They can now publish listings."
      : "Seller application declined.",
  );
}

export async function reviewListingAction(
  id: string,
  status: "approved" | "rejected",
  note?: string,
): Promise<ActionState> {
  await requireRole("admin");

  if (status === "rejected" && (!note || note.trim().length < 10)) {
    return fail("Explain why the listing was removed (10+ characters).");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ status, review_note: note?.trim() || null })
    .eq("id", id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/admin/marketplace");
  revalidateTag(CACHE_TAGS.listings);
  revalidatePath("/marketplace");

  return ok(
    status === "approved" ? "Listing approved." : "Listing removed.",
  );
}