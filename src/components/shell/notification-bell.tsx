"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Sparkles,
  Store,
  UserCog,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import type { NotificationType } from "@/lib/constants";
import type { Tables } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICONS: Record<NotificationType, typeof Bell> = {
  event_approved: CircleCheck,
  event_rejected: CircleAlert,
  event_reminder: CalendarClock,
  attendance_verified: BadgeCheck,
  opportunity_deadline: CalendarClock,
  portfolio_updated: Sparkles,
  seller_approved: Store,
  seller_rejected: Store,
  listing_approved: Store,
  listing_removed: Store,
  role_changed: UserCog,
};

const TONES: Partial<Record<NotificationType, string>> = {
  event_approved: "text-emeraldx-600 bg-emeraldx-50",
  attendance_verified: "text-emeraldx-600 bg-emeraldx-50",
  portfolio_updated: "text-orbit-600 bg-orbit-50",
  seller_approved: "text-emeraldx-600 bg-emeraldx-50",
  listing_approved: "text-emeraldx-600 bg-emeraldx-50",
  event_rejected: "text-red-600 bg-red-50",
  seller_rejected: "text-red-600 bg-red-50",
  listing_removed: "text-red-600 bg-red-50",
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Tables<"notifications">[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg text-navy-600 transition-colors hover:bg-secondary hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="size-[18px]" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-navy-900">Notifications</p>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  await markAllNotificationsReadAction();
                })
              }
            >
              <CheckCheck aria-hidden />
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-[26rem] overflow-y-auto scrollbar-slim">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell
                className="mx-auto size-5 text-muted-foreground/60"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-navy-800">
                Nothing yet
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                You will hear from us when an event is approved or your
                attendance is verified.
              </p>
            </div>
          ) : (
            <ul>
              {notifications.map((item) => {
                const Icon = ICONS[item.type as NotificationType] ?? Bell;
                const tone =
                  TONES[item.type as NotificationType] ??
                  "text-navy-600 bg-secondary";

                const body = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors",
                      !item.read && "bg-orbit-50/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                        tone,
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-navy-900">
                        {item.title}
                      </p>
                      {item.body ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {formatDistanceToNowStrict(new Date(item.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!item.read ? (
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    ) : null}
                  </div>
                );

                return (
                  <li key={item.id} className="border-b border-border/70 last:border-0">
                    {item.link ? (
                      <Link
                        href={item.link}
                        onClick={() => setOpen(false)}
                        className="block hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
