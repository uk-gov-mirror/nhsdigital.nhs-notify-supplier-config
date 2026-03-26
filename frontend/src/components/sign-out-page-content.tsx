"use client";

import { signOut } from "aws-amplify/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SignOutPageContent() {
  const [status, setStatus] = useState<"pending" | "complete" | "failed">(
    "pending",
  );

  useEffect(() => {
    signOut()
      .then(() => {
        setStatus("complete");
      })
      .catch(() => {
        setStatus("failed");
      });
  }, []);

  return (
    <main className="nhsuk-main-wrapper" id="main-content">
      <div className="nhsuk-width-container">
        <h1>Sign out</h1>
        {status === "pending" ? <p>Signing you out…</p> : null}
        {status === "complete" ? (
          <div className="nhsuk-card">
            <div className="nhsuk-card__content">
              <p>You have been signed out of supplier config admin.</p>
              <Link className="nhsuk-button" href="/auth">
                Sign in again
              </Link>
            </div>
          </div>
        ) : null}
        {status === "failed" ? (
          <div
            className="nhsuk-error-summary"
            aria-labelledby="sign-out-error-title"
            role="alert"
            tabIndex={-1}
          >
            <h2
              className="nhsuk-error-summary__title"
              id="sign-out-error-title"
            >
              We could not sign you out automatically
            </h2>
            <div className="nhsuk-error-summary__body">
              <p>Try signing in again or refresh the page before retrying.</p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
