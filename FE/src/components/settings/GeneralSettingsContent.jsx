import { useEffect, useState } from "react";
import {
  FiActivity,
  FiBell,
  FiMail,
  FiMoon,
  FiSettings,
  FiShield,
  FiSlack,
  FiSun,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeProvider";
import {
  getUserDisplayName,
  getUserRole,
} from "../../utils/authStorage";
import {
  getGeneralSettings,
  saveGeneralSettings,
  SETTINGS_CHANGED_EVENT,
} from "../../utils/generalSettingsStorage";
import { showServerSuccessToast } from "../../utils/toast";

import SettingsCardHeader from "./SettingsCardHeader";

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

function ThemeOption({ label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      className={`settings-theme-option${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <Icon aria-hidden="true" />
      {label}
    </button>
  );
}

function MerchantSettings({ settings, onChange }) {
  const { theme, setTheme } = useTheme();
  const displayName = getUserDisplayName();
  const role = getUserRole();
  const profileInitial = (displayName || "U").trim().charAt(0).toUpperCase();

  const updateNotifications = (key) => {
    onChange({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
  };

  return (
    <div className="settings-sections">
      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiMoon}
          title="Theme"
          description="Choose how the dashboard looks on this device."
        />

        <div className="settings-theme-options">
          <ThemeOption
            label="Light"
            icon={FiSun}
            active={theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemeOption
            label="Dark"
            icon={FiMoon}
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiBell}
          title="Notifications"
          description="Control which alerts you receive while using the platform."
        />

        <div className="security-toggle-list">
          <ToggleRow
            icon={FiMail}
            title="Email Alerts"
            description="Receive account and platform updates by email."
            enabled={settings.notifications.emailAlerts}
            onToggle={() => updateNotifications("emailAlerts")}
          />
          <ToggleRow
            icon={FiActivity}
            title="Transaction Alerts"
            description="Get notified about pay-in and payout activity."
            enabled={settings.notifications.transactionAlerts}
            onToggle={() => updateNotifications("transactionAlerts")}
          />
          <ToggleRow
            icon={FiShield}
            title="Risk Alerts"
            description="Receive chargeback, lien, and compliance notifications."
            enabled={settings.notifications.riskAlerts}
            onToggle={() => updateNotifications("riskAlerts")}
          />
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiUser}
          title="Account"
          description="Your current account details and access level."
        />

        <div className="settings-account-card">
          <div className="settings-account-card__avatar">{profileInitial}</div>
          <div className="settings-account-card__details">
            <strong>{displayName || "Account user"}</strong>
            <span className={`role-badge ${role}`}>
              {role === "admin" ? "Admin" : "Merchant"}
            </span>
          </div>
          <Link to="/profile" className="ds-secondary-btn settings-account-card__action">
            View Profile
          </Link>
        </div>
      </article>
    </div>
  );
}

function AdminSettings({ settings, onChange }) {
  const { theme, setTheme } = useTheme();

  const updateRoot = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  const updatePlatformAlerting = (key) => {
    onChange({
      ...settings,
      platformAlerting: {
        ...settings.platformAlerting,
        [key]: !settings.platformAlerting[key],
      },
    });
  };

  const updateSecurityPolicy = (key) => {
    onChange({
      ...settings,
      securityPolicy: {
        ...settings.securityPolicy,
        [key]: !settings.securityPolicy[key],
      },
    });
  };

  const updateAuditRetention = (event) => {
    onChange({
      ...settings,
      auditLogging: {
        ...settings.auditLogging,
        retentionDays: Number(event.target.value),
      },
    });
  };

  return (
    <div className="settings-sections">
      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiMoon}
          title="Theme"
          description="Choose how the admin dashboard looks on this device."
        />

        <div className="settings-theme-options">
          <ThemeOption
            label="Light"
            icon={FiSun}
            active={theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemeOption
            label="Dark"
            icon={FiMoon}
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiActivity}
          title="System Monitoring"
          description="Operational status tracking across platform services."
        />

        <div className="security-toggle-list">
          <ToggleRow
            icon={FiActivity}
            title="Monitoring Dashboard"
            description="Track uptime, queue health, and service incidents."
            enabled={settings.systemMonitoring}
            onToggle={() => updateRoot("systemMonitoring", !settings.systemMonitoring)}
          />
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiBell}
          title="Platform Alerting"
          description="Configure where critical platform alerts are delivered."
        />

        <div className="security-toggle-list">
          <ToggleRow
            icon={FiMail}
            title="Email Routing"
            description="Send error and incident alerts to the admin mailing list."
            enabled={settings.platformAlerting.email}
            onToggle={() => updatePlatformAlerting("email")}
          />
          <ToggleRow
            icon={FiSlack}
            title="Slack Routing"
            description="Post operational alerts to the configured Slack channel."
            enabled={settings.platformAlerting.slack}
            onToggle={() => updatePlatformAlerting("slack")}
          />
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiShield}
          title="Global Security Policy"
          description="Platform-wide authentication and access requirements."
        />

        <div className="security-toggle-list">
          <ToggleRow
            icon={FiShield}
            title="MFA Enforcement"
            description="Require multi-factor authentication for all admin accounts."
            enabled={settings.securityPolicy.mfaEnforcement}
            onToggle={() => updateSecurityPolicy("mfaEnforcement")}
          />
        </div>
      </article>

      <article className="settings-panel-card">
        <SettingsCardHeader
          icon={FiSettings}
          title="Audit Logging"
          description="Retention policy for admin and merchant activity logs."
        />

        <label className="ds-form-field settings-retention-field">
          <span className="ds-form-label">Retention period</span>
          <select
            className="ds-form-select"
            value={settings.auditLogging.retentionDays}
            onChange={updateAuditRetention}
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
        </label>
      </article>
    </div>
  );
}

function GeneralSettingsContent() {
  const isAdmin = getUserRole() === "admin";
  const [settings, setSettings] = useState(() => getGeneralSettings());

  useEffect(() => {
    const refresh = () => setSettings(getGeneralSettings());
    window.addEventListener(SETTINGS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, refresh);
  }, []);

  const handleChange = (nextSettings) => {
    setSettings(nextSettings);
    saveGeneralSettings(nextSettings);
    showServerSuccessToast("Settings updated.");
  };

  return isAdmin ? (
    <AdminSettings settings={settings} onChange={handleChange} />
  ) : (
    <MerchantSettings settings={settings} onChange={handleChange} />
  );
}

export default GeneralSettingsContent;
