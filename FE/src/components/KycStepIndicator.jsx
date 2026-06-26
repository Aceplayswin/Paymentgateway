import { FiCheck } from "react-icons/fi";

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Business" },
  { id: 3, label: "Documents" },
  { id: 4, label: "Bank" },
  { id: 5, label: "Verify" },
];

function KycStepIndicator({ currentStep, totalSteps = STEPS.length }) {
  const visibleSteps = STEPS.slice(0, totalSteps);

  return (
    <div className="kyc-stepper-wrap">
      <nav className="kyc-stepper" aria-label="KYC verification steps">
        {visibleSteps.map((step, index) => {
          const isComplete = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLast = index === visibleSteps.length - 1;

          return (
            <div key={step.id} className="kyc-stepper-item">
              <div
                className={`kyc-step${isActive ? " kyc-step-active" : ""}${isComplete ? " kyc-step-complete" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="kyc-step-number" aria-hidden="true">
                  {isComplete ? <FiCheck strokeWidth={2.5} /> : step.id}
                </span>
                <span className="kyc-step-label">{step.label}</span>
              </div>

              {!isLast ? (
                <div
                  className={`kyc-step-connector${isComplete ? " is-complete" : ""}`}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default KycStepIndicator;
