import { useMemo, useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiSmartphone } from "react-icons/fi";
import SettingsCardHeader from "./SettingsCardHeader";

function getPasswordStrength(password) {
  if (!password) {
    return { label: "", level: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ["Weak", "Fair", "Good", "Strong"];
  return {
    label: labels[Math.max(0, score - 1)],
    level: score,
  };
}

function PasswordField({ label, name, value, onChange, visible, onToggle }) {
  return (
    <label className="ds-form-field">
      <span className="ds-form-label">{label}</span>
      <div className="ds-password-wrap">
        <input
          className="ds-form-input ds-password-input"
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
        <button
          type="button"
          className="ds-password-toggle"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </label>
  );
}

function ToggleRow({ icon: Icon, title, description, enabled, onToggle }) {
  return (
    <div className="security-toggle-row">
      <div className="security-toggle-row__icon">
        <Icon aria-hidden="true" />
      </div>
      <div className="security-toggle-row__copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className={`ds-toggle${enabled ? " is-on" : ""}`}
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
      >
        <span className="ds-toggle__thumb" />
      </button>
    </div>
  );
}

function SecuritySettingsContent() {
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [visibility, setVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [smsAuth, setSmsAuth] = useState(true);
  const [appAuth, setAppAuth] = useState(false);

  const strength = useMemo(() => getPasswordStrength(passwords.next), [passwords.next]);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswords((previous) => ({ ...previous, [name]: value }));
  };

  const toggleVisibility = (field) => {
    setVisibility((previous) => ({ ...previous, [field]: !previous[field] }));
  };

  const handlePasswordReset = () => {
    setPasswords({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="settings-sections">
      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiLock}
          title="Change Password"
          description="Update your password to keep your account secure."
        />

        <div className="security-password-form">
          <PasswordField
            label="Current Password"
            name="current"
            value={passwords.current}
            onChange={handlePasswordChange}
            visible={visibility.current}
            onToggle={() => toggleVisibility("current")}
          />
          <PasswordField
            label="New Password"
            name="next"
            value={passwords.next}
            onChange={handlePasswordChange}
            visible={visibility.next}
            onToggle={() => toggleVisibility("next")}
          />

          {passwords.next ? (
            <div className="password-strength">
              <div className="password-strength__label">
                Password strength: <strong>{strength.label}</strong>
              </div>
              <div className="password-strength__bar">
                <span
                  className="password-strength__fill"
                  style={{ width: `${(strength.level / 4) * 100}%` }}
                />
              </div>
              <p className="password-strength__hint">
                Use 8+ characters with uppercase, numbers, and symbols for a stronger password.
              </p>
            </div>
          ) : null}

          <PasswordField
            label="Confirm New Password"
            name="confirm"
            value={passwords.confirm}
            onChange={handlePasswordChange}
            visible={visibility.confirm}
            onToggle={() => toggleVisibility("confirm")}
          />
        </div>

        <div className="settings-panel-card__actions">
          <button type="button" className="ds-secondary-btn" onClick={handlePasswordReset}>
            Cancel
          </button>
          <button type="button" className="ds-inline-primary-btn">
            <FiLock aria-hidden="true" />
            Update Password
          </button>
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiSmartphone}
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account."
        />

        <div className="security-toggle-list">
          <ToggleRow
            icon={FiSmartphone}
            title="SMS Authentication"
            description="Receive verification codes via text message."
            enabled={smsAuth}
            onToggle={() => setSmsAuth((previous) => !previous)}
          />
          <ToggleRow
            icon={FiLock}
            title="Authenticator App"
            description="Use an authenticator app to generate verification codes."
            enabled={appAuth}
            onToggle={() => setAppAuth((previous) => !previous)}
          />
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiLock}
          title="Login Activity"
          description="Recent sign-ins across your trusted devices."
        />

        <div className="security-activity-table-wrap">
          <table className="security-activity-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Location</th>
                <th>Date / Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chrome on Windows</td>
                <td>Mumbai, India</td>
                <td>Today, 10:24 AM</td>
              </tr>
              <tr>
                <td>Safari on iPhone</td>
                <td>Mumbai, India</td>
                <td>Yesterday, 6:15 PM</td>
              </tr>
              <tr>
                <td>Firefox on macOS</td>
                <td>Bengaluru, India</td>
                <td>Jun 5, 2026 · 2:40 PM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

export default SecuritySettingsContent;
