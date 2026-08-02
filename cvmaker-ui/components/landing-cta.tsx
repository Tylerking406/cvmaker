"use client";

import Link from "next/link";
import { FileText, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

/**
 * The landing page used to link straight to /dashboard with no sign-in affordance
 * anywhere, so a logged-out visitor's first click bounced them to /login with no warning,
 * and a signed-in visitor got no indication they were signed in.
 */
export function LandingNavCta() {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-8 w-32" />;

  return user ? (
    <Link href="/dashboard">
      <Button size="sm">Go to dashboard</Button>
    </Link>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button size="sm" variant="ghost">Sign in</Button>
      </Link>
      <Link href="/login">
        <Button size="sm">Get started</Button>
      </Link>
    </div>
  );
}

export function LandingHeroCta() {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-11 w-48" />;

  return user ? (
    <Link href="/dashboard">
      <Button size="lg" className="gap-2">
        <FileText className="h-4 w-4" />
        Open dashboard
      </Button>
    </Link>
  ) : (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <Link href="/login">
        <Button size="lg" className="gap-2">
          <FileText className="h-4 w-4" />
          Create your CV — free
        </Button>
      </Link>
      <Link href="/login">
        <Button size="lg" variant="outline" className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </Link>
    </div>
  );
}
