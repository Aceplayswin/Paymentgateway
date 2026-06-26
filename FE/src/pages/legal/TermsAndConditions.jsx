import LegalDocument from "../../components/legal/LegalDocument";
import LegalPageShell from "../../components/legal/LegalPageShell";
import { LEGAL_LAST_UPDATED, termsSections } from "../../data/legalContent";

function TermsAndConditions() {
  return (
    <LegalPageShell title="Terms & Conditions" lastUpdated={LEGAL_LAST_UPDATED}>
      <p className="legal-page__intro">
        Please read these Terms carefully before using Paygate services. These Terms apply to all
        merchants, administrators, and authorized users of the platform.
      </p>
      <LegalDocument sections={termsSections} />
    </LegalPageShell>
  );
}

export default TermsAndConditions;
