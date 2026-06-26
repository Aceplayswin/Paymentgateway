import { FiLock, FiSettings } from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";

const SETTINGS_NAV = [
  {
    to: "/settings",
    label: "General",
    description: "Theme, notifications, and account preferences.",
    icon: FiSettings,
    end: true,
  },
  {
    to: "/settings/security",
    label: "Security",
    description: "Password, two-factor authentication, and login activity.",
    icon: FiLock,
    end: true,
  },
];

function SettingsLayout({ children }) {
  const { pathname } = useLocation();
  const activeSection =
    SETTINGS_NAV.find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to),
    ) ?? SETTINGS_NAV[0];

  return (
    <section className="settings-page">
      <header className="content-header">
        <div>
          <p className="settings-page__eyebrow">Settings</p>
          <h1>{activeSection.label}</h1>
          <p>{activeSection.description}</p>
        </div>
      </header>

      <div className="settings-page__body">
        <aside className="settings-sidebar">
          <p className="settings-sidebar__label">Menu</p>
          <nav className="settings-nav" aria-label="Settings navigation">
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `settings-nav__item${isActive ? " is-active" : ""}`
                  }
                  end={item.end}
                >
                  <span className="settings-nav__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="settings-nav__copy">
                    <strong>{item.label}</strong>
                    <span>{item.description.split(",")[0]}</span>
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="settings-page__content">{children}</div>
      </div>
    </section>
  );
}

export default SettingsLayout;
