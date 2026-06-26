import LegalDocument from "../../components/legal/LegalDocument";
import LegalPageShell from "../../components/legal/LegalPageShell";
import { LEGAL_LAST_UPDATED, privacySections } from "../../data/legalContent";

function PrivacyPolicy() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <p className="legal-page__intro">
        This Privacy Policy describes how Paygate Limited collects, uses, stores, and protects
        personal information when you use our website, dashboard, and payment services.
      </p>
      <LegalDocument sections={privacySections} />
    </LegalPageShell>
  );
}

export default PrivacyPolicy;
