import Link from "next/link";
import { BadgeCheck, Users } from "lucide-react";
import { format } from "date-fns";

import { requireRole } from "@/lib/auth";
import { listUsers } from "@/lib/queries/admin";
import { initials } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { UserRowActions } from "@/components/admin/user-row-actions";

export const metadata = { title: "Users" };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const admin = await requireRole("admin");
  const params = await searchParams;

  const users = await listUsers(params.q);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Search accounts, adjust roles and suspend abusive accounts. Suspension preserves evidence and moderation history."
      />

      <FilterBar placeholder="Search by name, email or handle…" />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match that search"
          description="Try a different name, email address or handle."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {users.map((user) => {
                const verifiedCount = user.verified?.[0]?.count ?? 0;

                return (
                  <li
                    key={user.id}
                    className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-10">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-navy-100 text-xs font-semibold text-navy-700">
                          {initials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-navy-900">
                            {user.full_name}
                          </p>
                          {user.suspended ? (
                            <Badge variant="rejected">Suspended</Badge>
                          ) : null}
                          <Badge variant="secondary">
                            {ROLE_LABELS[user.role as Role]}
                          </Badge>
                        </div>

                        <p className="truncate text-xs text-muted-foreground">
                          {user.email} · joined{" "}
                          {format(new Date(user.created_at), "MMM yyyy")}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          {verifiedCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emeraldx-700">
                              <BadgeCheck className="size-3.5" aria-hidden />
                              {verifiedCount} activity{" "}
                              {verifiedCount === 1 ? "record" : "records"}
                            </span>
                          ) : null}

                          {user.username ? (
                            <Link
                              href={`/portfolio/${user.username}`}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              View portfolio
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <UserRowActions
                        userId={user.id}
                        fullName={user.full_name}
                        role={user.role as Role}
                        suspended={user.suspended}
                        isSelf={user.id === admin.id}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
