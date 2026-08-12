import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-navy-900">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Log in to your CampusOrbit account.
      </p>

      <div className="mt-8">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        New to CampusOrbit?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
