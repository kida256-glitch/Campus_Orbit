"use client";

import { useTransition } from "react";
import { BadgeCheck, Check, Undo2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RegistrationStatusBadge } from "@/components/shared/status-badge";
import { initials } from "@/lib/utils";
import {
  verifyAllAttendedAction,
  verifyAttendanceAction,
} from "@/lib/actions/registrations";
import type { RegistrationRow } from "@/lib/queries/leader";

/**
 * The attendance sheet — the single point where participation becomes proof.
 *
 * Verification is intentionally an explicit, attributable act: the database
 * records who verified and when, and notifies the student. Reverting is
 * possible, which is why the confirm dialog spells out the consequence.
 */
export function AttendanceSheet({
  eventId,
  registrations,
  isPast,
}: {
  eventId: string;
  registrations: RegistrationRow[];
  isPast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const awaiting = registrations.filter(
    (row) => row.status === "registered" || row.status === "attended",
  );
  const verified = registrations.filter((row) => row.status === "verified");
  const interested = registrations.filter((row) => row.status === "interested");

  function setStatus(
    registrationId: string,
    status: "registered" | "attended" | "verified",
  ) {
    startTransition(async () => {
      const result = await verifyAttendanceAction(
        registrationId,
        eventId,
        status,
      );
      if (result.ok) toast.success(result.message ?? "Updated");
      else toast.error(result.message);
    });
  }

  function verifyAll() {
    startTransition(async () => {
      const result = await verifyAllAttendedAction(eventId);
      if (result.ok) toast.success(result.message ?? "Verified");
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-orbit-600" aria-hidden />
              Attendance
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {verified.length} verified · {awaiting.length} to verify ·{" "}
              {interested.length} interested
            </p>
          </div>

          {awaiting.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="emerald" disabled={pending}>
                  <BadgeCheck aria-hidden />
                  Verify all {awaiting.length}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Verify {awaiting.length}{" "}
                    {awaiting.length === 1 ? "participant" : "participants"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This confirms they genuinely took part. Each one becomes
                    permanent evidence on that student&apos;s portfolio, and
                    they will be notified. Only verify people who actually
                    attended.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={verifyAll}>
                    Verify all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {registrations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nobody has registered yet"
            description="Registrations appear here as students sign up. After the event you can verify who actually attended."
          />
        ) : (
          <>
            {!isPast ? (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                This event hasn&apos;t happened yet. Verify attendance
                afterwards so the evidence reflects reality.
              </p>
            ) : null}

            <ul className="divide-y divide-border">
              {registrations.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9">
                      {row.student?.avatar_url ? (
                        <AvatarImage src={row.student.avatar_url} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-navy-100 text-xs font-semibold text-navy-700">
                        {initials(row.student?.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">
                        {row.student?.full_name ?? "Unknown student"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Signed up{" "}
                        {format(new Date(row.created_at), "d MMM yyyy")}
                        {row.verified_at
                          ? ` · verified ${format(new Date(row.verified_at), "d MMM")}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <RegistrationStatusBadge status={row.status} />

                    {row.status === "verified" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={pending}
                        onClick={() => setStatus(row.id, "attended")}
                        aria-label={`Revert verification for ${row.student?.full_name}`}
                      >
                        <Undo2 aria-hidden />
                        Revert
                      </Button>
                    ) : row.status === "interested" ? (
                      <Badge variant="muted">Not registered</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={pending}
                        onClick={() => setStatus(row.id, "verified")}
                      >
                        <Check aria-hidden />
                        Verify
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
