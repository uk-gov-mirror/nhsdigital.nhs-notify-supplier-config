import Link from "next/link";

type PlaceholderPageProps = Readonly<{
  description: string;
  title: string;
}>;

export function PlaceholderPage({ description, title }: PlaceholderPageProps) {
  return (
    <main className="nhsuk-main-wrapper" id="main-content">
      <div className="nhsuk-width-container">
        <span className="nhsuk-caption-l">Phase 1 scaffold</span>
        <h1>{title}</h1>
        <p className="nhsuk-body-l">{description}</p>
        <div className="nhsuk-card">
          <div className="nhsuk-card__content">
            <h2 className="nhsuk-card__heading">What is included now</h2>
            <ul className="nhsuk-list nhsuk-list--bullet">
              <li>NHS-styled page shell</li>
              <li>Simplified Amplify authentication wiring</li>
              <li>Navigation for the supplier-config domains</li>
              <li>
                Placeholders ready for backend and CRUD work in later phases
              </li>
            </ul>
            <p>
              Phase 2 will add the single API lambda and DynamoDB-backed data
              access.
            </p>
            <Link className="nhsuk-button nhsuk-button--secondary" href="/">
              Back to overview
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
