import { ShieldAlert } from "lucide-react";

import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Account suspended" };

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-mesh px-6 py-8">
      <Logo />

      <main
        id="main"
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center text-center"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50">
          <ShieldAlert className="size-5 text-destructive" aria-hidden />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-navy-900">
          Your account is suspended
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A CampusOrbit administrator has paused access to this account. Your
          verified activity and portfolio evidence are preserved. If you think
          this is a mistake, contact the campus team that manages CampusOrbit.
        </p>

        <form action={signOutAction} className="mt-8">
          <Button type="submit" variant="outline" className="w-full">
            Log out
          </Button>
        </form>
      </main>
    </div>
  );
}
