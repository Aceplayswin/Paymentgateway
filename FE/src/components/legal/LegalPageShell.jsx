import { Link } from "react-router-dom";
import AuthPageShell from "../auth/AuthPageShell";
import "../../styles/legal.css";

function LegalPageShell({ title, lastUpdated, children }) {
  return (
    <AuthPageShell variant="legal">
      <article className="legal-page">
        <header className="legal-page__header">
          <Link className="legal-page__back" to="/">
            &larr; Back to Home
          </Link>
          <h1 className="legal-page__title">{title}</h1>
          {lastUpdated ? <p className="legal-page__updated">Last updated: {lastUpdated}</p> : null}
        </header>
        <div className="legal-page__content">{children}</div>
        <footer className="legal-page__footer">
          <Link className="legal-page__link" to="/terms">
            Terms &amp; Conditions
          </Link>
          <span className="legal-page__separator" aria-hidden="true">
            |
          </span>
          <Link className="legal-page__link" to="/privacy">
            Privacy Policy
          </Link>
        </footer>
      </article>
    </AuthPageShell>
  );
}

export default LegalPageShell;
