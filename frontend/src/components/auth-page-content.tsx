"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getBasePath } from "@/utils/get-base-path";

export function AuthPageContent() {
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(() => {
    const redirect = searchParams.get("redirect");

    return redirect || getBasePath() || "/";
  }, [searchParams]);
  const error = searchParams.get("error");

  return (
    <main className="nhsuk-main-wrapper" id="main-content">
      <div className="nhsuk-width-container">
        <h1>Sign in to supplier config admin</h1>
        <p className="nhsuk-body-l">
          Use an account in the admin group to access the application.
        </p>
        {error === "not-admin" ? (
          <div className="nhsuk-warning-callout">
            <h2 className="nhsuk-warning-callout__label">Access required</h2>
            <p>
              Your account signed in successfully, but it is not currently a
              member of the admin group.
            </p>
          </div>
        ) : null}
        <div className="notify-auth-card">
          <Authenticator hideSignUp loginMechanisms={["email"]}>
            {({ signOut }) => (
              <div className="nhsuk-card">
                <div className="nhsuk-card__content">
                  <h2 className="nhsuk-card__heading">Signed in</h2>
                  <p>
                    You can now continue to the supplier config admin shell.
                  </p>
                  <div className="notify-button-row">
                    <Link className="nhsuk-button" href={redirectTarget}>
                      Continue
                    </Link>
                    <button
                      className="nhsuk-button nhsuk-button--secondary"
                      onClick={signOut}
                      type="button"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Authenticator>
        </div>
      </div>
    </main>
  );
}
