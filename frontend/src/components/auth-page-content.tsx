"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AuthPageContentProps = Readonly<{
  error?: string;
  redirectTarget: string;
}>;

type AuthenticatedRedirectProps = Readonly<{
  redirectTarget: string;
}>;

function AuthenticatedRedirect({ redirectTarget }: AuthenticatedRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(redirectTarget);
  }, [redirectTarget, router]);

  return (
    <div className="nhsuk-card">
      <div className="nhsuk-card__content">
        <p>Signing you in…</p>
        <Link className="nhsuk-button" href={redirectTarget}>
          Continue
        </Link>
      </div>
    </div>
  );
}

export function AuthPageContent({
  error,
  redirectTarget,
}: AuthPageContentProps) {
  return (
    <main className="nhsuk-main-wrapper" id="main-content">
      <div className="nhsuk-width-container">
        <h1>Sign in</h1>
        {error === "not-admin" ? (
          <div className="nhsuk-warning-callout">
            <h2 className="nhsuk-warning-callout__label">
              Admin access required
            </h2>
            <p>Your account is signed in but does not have admin access.</p>
          </div>
        ) : null}
        <div className="notify-auth-card">
          <Authenticator hideSignUp loginMechanisms={["email"]}>
            {() => <AuthenticatedRedirect redirectTarget={redirectTarget} />}
          </Authenticator>
        </div>
      </div>
    </main>
  );
}
