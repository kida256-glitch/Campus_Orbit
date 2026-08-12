"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Store } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FormError } from "@/components/forms/field";
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

/**
 * Seller onboarding and listing creation.
 *
 * Three states: no application, pending review, approved. Only the approved
 * state exposes the listing form — and RLS refuses the insert regardless, so
 * the gating here is purely about not showing a form that would fail.
 */
export function SellerPanel({ application, myListings }: SellerPanelProps) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const applyRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLFormElement>(null);

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

            <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Apply to become a seller
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Apply to sell</DialogTitle>
                  <DialogDescription>
                    An administrator reviews every application.
                  </DialogDescription>
                </DialogHeader>

                <form
                  ref={applyRef}
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
                      placeholder="Kizza Campus Tech"
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
                      placeholder="Refurbished laptops and accessories for students around Nakawa campus."
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

                  <DialogFooter>
                    <Button type="submit" loading={pending}>
                      Submit application
                    </Button>
                  </DialogFooter>
                </form>
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
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emeraldx-50/70 p-3">
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  {application.business_name}
                </p>
                <p className="text-xs text-emeraldx-700">Verified seller</p>
              </div>

              <Dialog open={listOpen} onOpenChange={setListOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus aria-hidden />
                    New listing
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create a listing</DialogTitle>
                    <DialogDescription>
                      Listings are moderated before appearing publicly.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    ref={listRef}
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
                        placeholder="Dell Latitude 7490 — i5, 16GB RAM"
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

                    <Field
                      label="Image URL"
                      name="imageUrl"
                      error={errors.imageUrl}
                      hint="Optional. Paste a link to a photo of the item."
                    >
                      <input
                        id="imageUrl"
                        name="imageUrl"
                        type="url"
                        placeholder="https://"
                        className={inputClass}
                      />
                    </Field>

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

                    <DialogFooter>
                      <Button type="submit" loading={pending}>
                        Submit for moderation
                      </Button>
                    </DialogFooter>
                  </form>
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
