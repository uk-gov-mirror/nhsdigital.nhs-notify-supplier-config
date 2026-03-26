import Link from "next/link";
import { getSessionServer } from "@/utils/amplify-utils";
import { navigationLinks } from "@/components/navigation-links";

export async function SiteHeader() {
  const session = await getSessionServer();
  const isAuthenticated = Boolean(session.accessToken);
  let accessStatusLabel = "Guest";

  if (isAuthenticated) {
    accessStatusLabel = session.isAdmin ? "Admin access" : "Access pending";
  }

  return (
    <header className="nhsuk-header" role="banner" data-module="nhsuk-header">
      <div className="nhsuk-header__container nhsuk-width-container">
        <div className="nhsuk-header__service">
          <Link
            className="nhsuk-header__service-logo"
            href="/"
            aria-label="NHS Notify supplier config admin"
          >
            <svg
              className="nhsuk-header__logo"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 80"
              height="40"
              width="100"
              focusable="false"
              role="img"
            >
              <title>NHS logo</title>
              <path
                fill="currentcolor"
                d="M200 0v80H0V0h200Zm-27.5 5.5c-14.5 0-29 5-29 22 0 10.2 7.7 13.5 14.7 16.3l.7.3c5.4 2 10.1 3.9 10.1 8.4 0 6.5-8.5 7.5-14 7.5s-12.5-1.5-16-3.5L135 70c5.5 2 13.5 3.5 20 3.5 15.5 0 32-4.5 32-22.5 0-19.5-25.5-16.5-25.5-25.5 0-5.5 5.5-6.5 12.5-6.5a35 35 0 0 1 14.5 3l4-13.5c-4.5-2-12-3-20-3Zm-131 2h-22l-14 65H22l9-45h.5l13.5 45h21.5l14-65H64l-9 45h-.5l-13-45Zm63 0h-18l-13 65h17l6-28H117l-5.5 28H129l13.5-65H125L119.5 32h-20l5-24.5Z"
              />
            </svg>
            <span className="nhsuk-header__service-name">
              Supplier config admin
            </span>
          </Link>
        </div>
        <nav className="nhsuk-header__account" aria-label="Account">
          <ul className="nhsuk-header__account-list">
            <li className="nhsuk-header__account-item">
              {session.displayName ??
                (isAuthenticated ? "Signed in" : "Not signed in")}
            </li>
            <li className="nhsuk-header__account-item">{accessStatusLabel}</li>
            <li className="nhsuk-header__account-item">
              <Link
                className="nhsuk-header__account-link"
                href={isAuthenticated ? "/auth/signout" : "/auth"}
              >
                {isAuthenticated ? "Sign out" : "Sign in"}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      {isAuthenticated ? (
        <nav
          className="nhsuk-header__navigation"
          aria-label="Primary navigation"
        >
          <div className="nhsuk-header__navigation-container nhsuk-width-container">
            <ul className="nhsuk-header__navigation-list">
              <li className="nhsuk-header__navigation-item">
                <Link className="nhsuk-header__navigation-link" href="/">
                  Overview
                </Link>
              </li>
              {navigationLinks.map((link) => (
                <li className="nhsuk-header__navigation-item" key={link.href}>
                  <Link
                    className="nhsuk-header__navigation-link"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
