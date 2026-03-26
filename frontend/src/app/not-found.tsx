import Link from "next/link";

export default function NotFound() {
  return (
    <main className="nhsuk-main-wrapper" id="main-content">
      <div className="nhsuk-width-container">
        <h1>Page not found</h1>
        <p>
          Check the address or return to the supplier config admin overview.
        </p>
        <Link className="nhsuk-button" href="/">
          Go to overview
        </Link>
      </div>
    </main>
  );
}
