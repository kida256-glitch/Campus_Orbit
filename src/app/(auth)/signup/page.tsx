import Link from "next/link";

import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-navy-900">
        Create your CampusOrbit account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start participating. Your portfolio builds itself from there.
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
