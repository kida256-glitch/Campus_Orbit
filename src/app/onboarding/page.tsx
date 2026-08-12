import { redirect } from "next/navigation";

import { requireProfile, dashboardPathFor } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Choose your interests" };

export default async function OnboardingPage() {
  const profile = await requireProfile();

  // Leaders and admins have no recommendation feed to personalise.
  if (profile.role !== "student") {
    redirect(dashboardPathFor(profile.role));
  }

  if (profile.onboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-mesh">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8">
        <Logo />

        <main id="main" className="flex-1 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orbit-600">
            One quick step
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-navy-900">
            What are you into, {profile.full_name.split(" ")[0]}?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            CampusOrbit uses this to rank events and opportunities for you. It
            is not a commitment — you can change these any time from your
            profile, and your recommendations improve as you participate.
          </p>

          <div className="mt-8">
            <OnboardingForm
              defaultInterests={profile.interests ?? []}
              defaultSkills={profile.skills ?? []}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
