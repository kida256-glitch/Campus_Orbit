"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Store } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FormError } from "@/components/forms/field";
import { ImagePicker } from "@/components/forms/image-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CONTACT_METHODS,
  LISTING_CONDITIONS,
  CONDITION_LABELS,
  MARKETPLACE_CATEGORIES,
} from "@/lib/constants";
import {
  applyAsSellerAction,
  createListingAction,
} from "@/lib/actions/marketplace";
import { ModerationStatusBadge } from "@/components/shared/status-badge";
import type { Tables } from "@/lib/types/database";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface SellerPanelProps {
  application: Tables<"seller_applications"> | null;
  myListings: Tables<"marketplace_listings">[];
}

export function SellerPanel({ application, myListings }: SellerPanelProps) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const applyRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLFormElement>(null);
  // Key forces ImagePicker to remount (reset) after successful submission
  const [listKey, setListKey] = useState(0);

  function submitApplication(formData: FormData) {
    startTransition(async () => {
      const result = await applyAsSellerAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Submitted");
        setErrors({});
        setFormError(undefined);
        setApplyOpen(false);
        applyRef.current?.reset();
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    });
  }

  function submitListing(formData: FormData) {
    startTransition(async () => {
      const result = await createListingAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Submitted");
        setErrors({});
        setFormError(undefined);
        setListOpen(false);
        listRef.current?.reset();
        setListKey((k) => k + 1);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="size-4 text-orbit-600" aria-hidden />
            Selling on CampusOrbit
          </CardTitle>
          {application ? (
            <ModerationStatusBadge status={application.status} />
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!application ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sellers are reviewed before they can list, which keeps the
              marketplace trustworthy. Transactions happen off-platform —
              CampusOrbit never handles payments.
            </p>

            {/* ── Apply to sell dialog ──────────────────────────────────── */}
            <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Apply to become a seller
                </Button>
              </DialogTrigger>

              {/*
               * flex + flex-col on the content panel means the header is
               * always visible, and only the form body scrolls. This fixes
               * the issue where the submit button was unreachable on small
               * screens.
               */}
              <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-lg">
                <div className="shrink-0 border-b border-border px-6 pb-4 pt-6">
                  <DialogHeader>
                    <DialogTitle>Apply to sell</DialogTitle>
                    <DialogDescription>
                      An administrator reviews every application before you can
                      list.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  <form
                    ref={applyRef}
                    id="apply-form"
                    action={submitApplication}
                    className="space-y-4"
                  >
                    <FormError message={formError} />

                    <Field
                      label="Shop name"
                      name="businessName"
                      error={errors.businessName}
                      required
                    >
                      <input
                        id="businessName"
                        name="businessName"
                        required
                        className={inputClass}
                        placeholder="e.g. Alex Tech Store"
                      />
                    </Field>

                    <Field
                      label="What do you sell?"
                      name="description"
                      error={errors.description}
                      hint="At least 20 characters. Moderators use this to decide."
                      required
                    >
                      <textarea
                        id="description"
                        name="description"
                        required
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="I sell refurbished laptops and phone accessories for students on campus."
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Contact via" name="contactMethod">
                        <select
                          id="contactMethod"
                          name="contactMethod"
                          className={inputClass}
                          defaultValue="whatsapp"
                        >
                          {CONTACT_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method === "whatsapp"
                                ? "WhatsApp"
                                : method === "phone"
                                  ? "Phone"
                                  : "Email"}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field
                        label="Contact detail"
                        name="contactValue"
                        error={errors.contactValue}
                        required
                      >
                        <input
                          id="contactValue"
                          name="contactValue"
                          required
                          className={inputClass}
                          placeholder="+256700000000"
                        />
                      </Field>
                    </div>
                  </form>
                </div>

                {/* Footer is always visible at the bottom */}
                <div className="shrink-0 border-t border-border px-6 py-4">
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setApplyOpen(false)}
                      disabled={pending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      form="apply-form"
                      loading={pending}
                    >
                      Submit application
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : application.status === "pending" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Your application for{" "}
            <strong>{application.business_name}</strong> is awaiting review.
            You&apos;ll get a notification once a moderator decides.
          </p>
        ) : application.status === "rejected" ? (
          <div className="rounded-xl border border-destructive/25 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium">Application declined</p>
            {application.review_note ? (
              <p className="mt-1 text-xs leading-relaxed">
                {application.review_note}
              </p>
            ) : null}
          </div>
        ) : (
          /* ── Approved seller state ──────────────────────────────────── */
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emeraldx-50/70 p-3">
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  {application.business_name}
                </p>
                <p className="text-xs text-emeraldx-700">Verified seller</p>
              </div>

              {/* ── New listing dialog ───────────────────────────────── */}
              <Dialog open={listOpen} onOpenChange={setListOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus aria-hidden />
                    New listing
                  </Button>
                </DialogTrigger>

                <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-lg">
                  <div className="shrink-0 border-b border-border px-6 pb-4 pt-6">
                    <DialogHeader>
                      <DialogTitle>Create a listing</DialogTitle>
                      <DialogDescription>
                        Listings are moderated before appearing publicly.
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    <form
                      key={listKey}
                      ref={listRef}
                      id="listing-form"
                      action={submitListing}
                      className="space-y-4"
                    >
                      <FormError message={formError} />

                      <Field
                        label="Item name"
                        name="productName"
                        error={errors.productName}
                        required
                      >
                        <input
                          id="productName"
                          name="productName"
                          required
                          className={inputClass}
                          placeholder="e.g. Dell Latitude 7490 — i5, 16GB RAM"
                        />
                      </Field>

                      <Field
                        label="Description"
                        name="description"
                        error={errors.description}
                        required
                      >
                        <textarea
                          id="description"
                          name="description"
                          required
                          rows={3}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Describe the item — condition, specs, what's included."
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Price (UGX)"
                          name="price"
                          error={errors.price}
                          required
                        >
                          <input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="1000"
                            required
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Condition" name="condition">
                          <select
                            id="condition"
                            name="condition"
                            className={inputClass}
                            defaultValue="good"
                          >
                            {LISTING_CONDITIONS.map((condition) => (
                              <option key={condition} value={condition}>
                                {CONDITION_LABELS[condition]}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <Field label="Category" name="category">
                        <select
                          id="category"
                          name="category"
                          className={inputClass}
                          defaultValue="Laptops"
                        >
                          {MARKETPLACE_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Upload or paste link */}
                      <ImagePicker
                        name="imageUrl"
                        label="Photo"
                        hint="Upload a photo or paste a link. Buyers trust listings with images."
                        error={errors.imageUrl}
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Contact via" name="contactMethod">
                          <select
                            id="contactMethod"
                            name="contactMethod"
                            className={inputClass}
                            defaultValue={application.contact_method}
                          >
                            {CONTACT_METHODS.map((method) => (
                              <option key={method} value={method}>
                                {method === "whatsapp"
                                  ? "WhatsApp"
                                  : method === "phone"
                                    ? "Phone"
                                    : "Email"}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field
                          label="Contact detail"
                          name="contactValue"
                          error={errors.contactValue}
                          required
                        >
                          <input
                            id="contactValue"
                            name="contactValue"
                            required
                            defaultValue={application.contact_value}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </form>
                  </div>

                  <div className="shrink-0 border-t border-border px-6 py-4">
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setListOpen(false)}
                        disabled={pending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        form="listing-form"
                        loading={pending}
                      >
                        Submit for moderation
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {myListings.length > 0 ? (
              <ul className="space-y-2">
                {myListings.map((listing) => (
                  <li
                    key={listing.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/80 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">
                        {listing.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {listing.currency}{" "}
                        {new Intl.NumberFormat("en-UG").format(listing.price)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        listing.status === "approved"
                          ? "verified"
                          : listing.status === "pending"
                            ? "pending"
                            : "rejected"
                      }
                    >
                      {listing.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                You have no listings yet.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
