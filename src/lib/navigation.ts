import {
  BadgeCheck,
  BarChart3,
  Bot,
  CalendarCheck,
  CalendarDays,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Role } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. Keep to five per role at most. */
  primary?: boolean;
}

/**
 * Navigation is derived from the role on the user's database profile, so the
 * menu cannot be widened by editing client state.
 */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, primary: true },
    { label: "Discover", href: "/discover", icon: Compass, primary: true },
    { label: "Events", href: "/events", icon: CalendarDays, primary: true },
    { label: "Opportunities", href: "/opportunities", icon: Target, primary: true },
    { label: "Portfolio", href: "/portfolio", icon: BadgeCheck, primary: true },
    { label: "AI Assistant", href: "/assistant", icon: Bot },
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { label: "Profile", href: "/profile", icon: UserRound },
  ],
  community_leader: [
    { label: "Dashboard", href: "/leader", icon: LayoutDashboard, primary: true },
    { label: "My Events", href: "/leader/events", icon: CalendarCheck, primary: true },
    { label: "Submit Event", href: "/leader/events/new", icon: Sparkles, primary: true },
    { label: "Opportunities", href: "/opportunities", icon: Target, primary: true },
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { label: "Profile", href: "/profile", icon: UserRound, primary: true },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, primary: true },
    { label: "Event Approvals", href: "/admin/events", icon: ShieldCheck, primary: true },
    { label: "Opportunities", href: "/admin/opportunities", icon: Target, primary: true },
    { label: "Marketplace", href: "/admin/marketplace", icon: Store, primary: true },
    { label: "Users", href: "/admin/users", icon: Users, primary: true },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Profile", href: "/profile", icon: UserRound },
  ],
};

export function navFor(role: Role): NavItem[] {
  return NAV_BY_ROLE[role];
}

export function primaryNavFor(role: Role): NavItem[] {
  return NAV_BY_ROLE[role].filter((item) => item.primary).slice(0, 5);
}

/** Longest-prefix match so nested routes keep the parent tab active. */
export function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/leader" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
