"use client";

import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import { signOutAction } from "@/lib/actions/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  fullName,
  email,
  role,
  avatarUrl,
  username,
}: {
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  username: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="size-8">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(fullName)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-navy-800 sm:inline">
            {fullName.split(" ")[0]}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-navy-900">
            {fullName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <span className="mt-1.5 inline-flex rounded-full bg-orbit-50 px-2 py-0.5 text-[10px] font-semibold text-orbit-700">
            {ROLE_LABELS[role]}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound aria-hidden />
            Profile
          </Link>
        </DropdownMenuItem>

        {role === "student" ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/portfolio">
                <BadgeCheck aria-hidden />
                My portfolio
              </Link>
            </DropdownMenuItem>
            {username ? (
              <DropdownMenuItem asChild>
                <Link href={`/portfolio/${username}`}>
                  <Settings aria-hidden />
                  Public portfolio view
                </Link>
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        <DropdownMenuSeparator />

        {/* A real form post, so sign-out works without JavaScript. */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="size-4" aria-hidden />
            Log out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
