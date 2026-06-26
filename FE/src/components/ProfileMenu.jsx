import { useEffect, useMemo, useRef, useState } from "react";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getUserEmail } from "../utils/authStorage";
import { getUserProfile, PROFILE_CHANGED_EVENT } from "../utils/profileStorage";

function ProfileMenu({ merchantName, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => getUserProfile(getUserEmail()).avatarUrl);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    const refreshAvatar = () => {
      setAvatarUrl(getUserProfile(getUserEmail()).avatarUrl);
    };

    window.addEventListener(PROFILE_CHANGED_EVENT, refreshAvatar);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, refreshAvatar);
  }, []);

  const profileLetter = useMemo(() => {
    const normalized = String(merchantName || "").trim();
    if (!normalized) return "U";
    return normalized.charAt(0).toUpperCase();
  }, [merchantName]);

  return (
    <div className="profile-menu-wrap" ref={menuRef}>
      <button
        type="button"
        className="profile-avatar-btn"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="avatar avatar--image" />
        ) : (
          <span className="avatar">{profileLetter}</span>
        )}
      </button>

      {open ? (
        <div className="profile-dropdown">
          <button
            type="button"
            onClick={() => {
              navigate("/profile");
              setOpen(false);
            }}
          >
            <FiUser />
            Profile Page
          </button>
          <button
            type="button"
            onClick={() => {
              navigate("/settings");
              setOpen(false);
            }}
          >
            <FiSettings />
            General Settings
          </button>
          <div className="profile-dropdown__divider" role="separator" />
          <button
            type="button"
            className="profile-dropdown__logout"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileMenu;
