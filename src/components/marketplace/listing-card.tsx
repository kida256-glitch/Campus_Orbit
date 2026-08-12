import Image from "next/image";
import { MessageCircle, Package, Phone, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { CONDITION_LABELS, type ListingCondition } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export interface ListingCardData {
  id: string;
  product_name: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  category: string;
  images: string[];
  contact_method: string;
  contact_value: string;
  seller?: { full_name: string; username: string | null } | null;
}

/** Contact links are built per method; there is no in-app messaging in v1. */
function contactHref(method: string, value: string) {
  switch (method) {
    case "whatsapp":
      return `https://wa.me/${value.replace(/[^\d]/g, "")}`;
    case "phone":
      return `tel:${value}`;
    default:
      return `mailto:${value}`;
  }
}

const CONTACT_ICONS = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
} as const;

export function ListingCard({
  listing,
  className,
  footer,
}: {
  listing: ListingCardData;
  className?: string;
  footer?: React.ReactNode;
}) {
  const ContactIcon =
    CONTACT_ICONS[listing.contact_method as keyof typeof CONTACT_ICONS] ??
    MessageCircle;

  const price = new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0,
  }).format(listing.price);

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-orbit-200 hover:shadow-card",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-secondary">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-8 text-navy-300" aria-hidden />
          </div>
        )}

        <Badge className="absolute left-3 top-3 border-transparent bg-white/95 text-navy-800 backdrop-blur">
          {listing.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug text-navy-900">
          {listing.product_name}
        </h3>

        <p className="mt-1.5 text-lg font-semibold tabular-nums text-navy-900">
          {listing.currency} {price}
        </p>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {listing.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {CONDITION_LABELS[listing.condition as ListingCondition] ??
              listing.condition}
          </Badge>
          {listing.seller ? (
            <span className="text-xs text-muted-foreground">
              {listing.seller.full_name}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          {footer ?? (
            <a
              href={contactHref(listing.contact_method, listing.contact_value)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-orbit-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ContactIcon className="size-4" aria-hidden />
              Contact seller
            </a>
          )}
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          CampusOrbit does not handle payments. Meet on campus and verify goods
          before paying.
        </p>
      </div>
    </article>
  );
}
