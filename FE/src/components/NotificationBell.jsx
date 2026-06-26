import { useEffect, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import { getUserRole } from "../utils/authStorage";

function formatNotificationTime(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString();
}

function NotificationBell() {
  const userRole = getUserRole();
  const { notifications, counts, dismissNotification, dismissAllNotifications } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (userRole !== "admin") {
    return (
      <button type="button" className="icon-action" aria-label="Notifications">
        <FiBell />
      </button>
    );
  }

  const handleOpen = () => {
    setOpen((previous) => !previous);
  };

  const handleNotificationClick = (notification) => {
    dismissNotification(notification.id);
    setOpen(false);
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className={`icon-action notification-bell__trigger ${open ? "active" : ""}`}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={handleOpen}
      >
        <FiBell />
        {counts.total > 0 ? (
          <span className="notification-bell__badge">{counts.total > 99 ? "99+" : counts.total}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-dropdown" role="menu" aria-label="Admin notifications">
          <div className="notification-dropdown__header">
            <strong>Notifications</strong>
            {counts.total > 0 ? (
              <button
                type="button"
                className="notification-dropdown__mark-all"
                onClick={dismissAllNotifications}
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="notification-dropdown__summary">
            <span>{counts.merchantRequests} account requests</span>
            <span>{counts.kycRequests} KYC submissions</span>
          </div>

          <div className="notification-dropdown__list">
            {notifications.length === 0 ? (
              <p className="notification-dropdown__empty">No notifications right now.</p>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link}
                  className={`notification-item unread${notification.type === "kyc_submitted" ? " notification-item--kyc" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item__title">{notification.title}</div>
                  <div className="notification-item__message">{notification.message}</div>
                  {notification.kycDetails ? (
                    <div className="notification-item__meta">{notification.kycDetails}</div>
                  ) : null}
                  <div className="notification-item__time">
                    {formatNotificationTime(notification.createdAt)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
