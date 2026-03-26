import Link from "next/link";
import { navigationLinks } from "@/components/navigation-links";

export default function HomePage() {
  return (
    <main className="nhsuk-main-wrapper" id="main-content">
      <div className="nhsuk-width-container">
        <span className="nhsuk-caption-l">Phase 1 scaffold</span>
        <h1>Supplier config admin</h1>
        <p className="nhsuk-body-l">
          This initial shell keeps the NHS-styled frontend, Amplify auth wiring,
          and the top-level navigation needed for supplier configuration work.
        </p>

        <div className="nhsuk-card nhsuk-u-margin-bottom-5">
          <div className="nhsuk-card__content">
            <h2 className="nhsuk-card__heading">What is ready now</h2>
            <ul className="nhsuk-list nhsuk-list--bullet">
              <li>
                top-level `frontend/` workspace copied from the
                template-management app
              </li>
              <li>
                template-management routes and client-group concepts removed
              </li>
              <li>a single admin-focused navigation model</li>
              <li>
                simplified authentication middleware ready for later backend
                integration
              </li>
            </ul>
          </div>
        </div>

        <div className="notify-card-grid">
          {navigationLinks.map((link) => (
            <Link className="notify-card-link" href={link.href} key={link.href}>
              <article className="nhsuk-card notify-dashboard-card">
                <div className="nhsuk-card__content">
                  <h2 className="nhsuk-card__heading">{link.label}</h2>
                  <p>{link.description}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
