function SettingsCardHeader({ icon: Icon, title, description }) {
  return (
    <header className="settings-panel-card__header">
      <span className="settings-panel-card__icon">
        <Icon aria-hidden="true" />
      </span>
      <div className="settings-panel-card__heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </header>
  );
}

export default SettingsCardHeader;
