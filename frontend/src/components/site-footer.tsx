export function SiteFooter() {
  return (
    <footer className="nhsuk-footer" role="contentinfo">
      <div className="nhsuk-width-container">
        <h2 className="nhsuk-u-visually-hidden">Support links</h2>
        <ul className="nhsuk-footer__list">
          <li className="nhsuk-footer__list-item">
            <a
              className="nhsuk-footer__list-item-link"
              href="https://digital.nhs.uk/services/nhs-notify"
            >
              NHS Notify service information
            </a>
          </li>
          <li className="nhsuk-footer__list-item">
            <a
              className="nhsuk-footer__list-item-link"
              href="https://digital.nhs.uk/services/nhs-notify/terms-and-conditions"
            >
              Terms and conditions
            </a>
          </li>
          <li className="nhsuk-footer__list-item">
            <a
              className="nhsuk-footer__list-item-link"
              href="https://digital.nhs.uk/services/nhs-notify/transparency-notice"
            >
              Privacy
            </a>
          </li>
        </ul>
        <p className="nhsuk-footer__copyright">&copy; Crown copyright</p>
      </div>
    </footer>
  );
}
