"use client";

import { useTransition } from "react";
import { Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";
import {
  changeUserRoleAction,
  setUserSuspendedAction,
} from "@/lib/actions/admin";

/**
 * Role and suspension controls.
 *
 * Both are refused for the admin's own account, in the action and again here,
 * so the platform cannot be left without a moderator.
 */
export function UserRowActions({
  userId,
  fullName,
  role,
  suspended,
  isSelf,
}: {
  userId: string;
  fullName: string;
  role: Role;
  suspended: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function changeRole(next: string) {
    if (next === role) return;

    startTransition(async () => {
      const result = await changeUserRoleAction(userId, next as Role);
      if (result.ok) toast.success(result.message ?? "Role updated");
      else toast.error(result.message);
    });
  }

  function toggleSuspension() {
    startTransition(async () => {
      const result = await setUserSuspendedAction(userId, !suspended);
      if (result.ok) toast.success(result.message ?? "Updated");
      else toast.error(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5">
        <span className="sr-only">Role for {fullName}</span>
        <select
          value={role}
          disabled={pending || isSelf}
          onChange={(event) => changeRole(event.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-navy-800 shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ROLES.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </select>
      </label>

      {isSelf ? (
        <span className="text-xs text-muted-foreground">Your account</span>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" disabled={pending}>
              {suspended ? (
                <>
                  <RotateCcw aria-hidden />
                  Restore
                </>
              ) : (
                <>
                  <Ban aria-hidden />
                  Suspend
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {suspended ? `Restore ${fullName}?` : `Suspend ${fullName}?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {suspended
                  ? "They regain access to CampusOrbit immediately."
                  : "They keep their account and their verified evidence, but lose access to the app and cannot submit or register for anything until restored."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={toggleSuspension}>
                {suspended ? "Restore account" : "Suspend account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
