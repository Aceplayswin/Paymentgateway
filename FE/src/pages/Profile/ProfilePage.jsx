import { useMemo, useRef, useState } from "react";
import {
  FiCalendar,
  FiCamera,
  FiEdit2,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { getUserEmail, getUserRole } from "../../utils/authStorage";
import {
  getKycStatusLabel,
  getMerchantOnboarding,
  KYC_STATUS,
} from "../../utils/onboardingStorage";
import {
  getUserProfile,
  readAvatarFile,
  saveUserProfile,
} from "../../utils/profileStorage";
import { showServerErrorToast, showServerSuccessToast } from "../../utils/toast";

const DEPARTMENTS = [
  "Management",
  "Operations",
  "Finance",
  "Engineering",
  "Customer Support",
];

function ProfilePage() {
  const userRole = getUserRole();
  const isAdmin = userRole === "admin";
  const initialEmail = getUserEmail();
  const onboarding = getMerchantOnboarding(initialEmail);

  const [savedProfile, setSavedProfile] = useState(() => getUserProfile(initialEmail));
  const [formData, setFormData] = useState(savedProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const profileLetter = useMemo(() => {
    const normalized = String(formData.fullName || "").trim();
    return normalized ? normalized.charAt(0).toUpperCase() : "U";
  }, [formData.fullName]);

  const kycLabel = onboarding
    ? getKycStatusLabel(onboarding.kycStatus)
    : isAdmin
      ? "Active"
      : "Fully Verified";

  const isActive =
    isAdmin || !onboarding || onboarding.kycStatus === KYC_STATUS.APPROVED;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleStartEdit = () => {
    setFormData(savedProfile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(savedProfile);
    setIsEditing(false);
  };

  const handleAvatarPick = () => {
    if (!isEditing) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const avatarUrl = await readAvatarFile(file);
      setFormData((previous) => ({ ...previous, avatarUrl }));
    } catch (error) {
      showServerErrorToast(error.message || "Could not upload profile image.");
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((previous) => ({ ...previous, avatarUrl: null }));
  };

  const handleSave = async () => {
    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();

    if (!fullName) {
      showServerErrorToast("Full name is required.");
      return;
    }

    if (!email) {
      showServerErrorToast("Email address is required.");
      return;
    }

    setIsSaving(true);

    try {
      const updated = saveUserProfile(
        {
          ...formData,
          fullName,
          email,
          phone: formData.phone.trim(),
          username: formData.username.trim(),
          location: formData.location.trim(),
          bio: formData.bio.trim(),
        },
        savedProfile.email,
      );

      setSavedProfile(updated);
      setFormData(updated);
      setIsEditing(false);
      showServerSuccessToast("Profile updated successfully.");
    } catch {
      showServerErrorToast("Could not save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="profile-page">
      <header className="content-header content-header--with-actions">
        <div>
          <h1>My Profile</h1>
          <p>View and manage your personal information.</p>
        </div>
        {!isEditing ? (
          <button type="button" className="profile-action-btn" onClick={handleStartEdit}>
            <FiEdit2 aria-hidden="true" />
            Edit Profile
          </button>
        ) : null}
      </header>

      <div className="profile-page__grid">
        <aside className="profile-summary-card">
          <div className="profile-avatar-block">
            <div className={`profile-avatar-large${formData.avatarUrl ? " has-image" : ""}`}>
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.fullName} className="profile-avatar-image" />
              ) : (
                <span>{profileLetter}</span>
              )}
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="profile-avatar-camera"
                    onClick={handleAvatarPick}
                    aria-label="Upload profile photo"
                  >
                    <FiCamera aria-hidden="true" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="profile-avatar-input"
                    onChange={handleAvatarChange}
                  />
                </>
              ) : null}
            </div>

            {isEditing && formData.avatarUrl ? (
              <button type="button" className="profile-avatar-remove" onClick={handleRemoveAvatar}>
                <FiTrash2 aria-hidden="true" />
                Remove photo
              </button>
            ) : null}

            <h2>{formData.fullName}</h2>
            <p className="profile-summary-role">{formData.jobTitle}</p>
            <p className="profile-summary-dept">{formData.department} Department</p>
            <span className={`profile-status-badge${isActive ? " is-active" : ""}`}>
              <span className="profile-status-dot" />
              {isActive ? "Active" : kycLabel}
            </span>
          </div>

          <ul className="profile-contact-list">
            <li>
              <FiMail aria-hidden="true" />
              <span>{formData.email}</span>
            </li>
            <li>
              <FiPhone aria-hidden="true" />
              <span>{formData.phone}</span>
            </li>
            <li>
              <FiMapPin aria-hidden="true" />
              <span>{formData.location}</span>
            </li>
            <li>
              <FiCalendar aria-hidden="true" />
              <span>Joined {formData.joinDate}</span>
            </li>
          </ul>
        </aside>

        <div className="profile-page__main">
          <article className="profile-panel-card">
            <header className="profile-panel-card__header">
              <FiUser aria-hidden="true" />
              <h3>Personal Information</h3>
            </header>

            <div className="profile-form-grid">
              <label className="ds-form-field">
                <span className="ds-form-label">Full Name</span>
                <input
                  className="ds-form-input"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Username</span>
                <input
                  className="ds-form-input"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Email Address</span>
                <input
                  className="ds-form-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  autoComplete="email"
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Phone Number</span>
                <input
                  className="ds-form-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Job Title</span>
                <input
                  className="ds-form-input"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Department</span>
                <select
                  className="ds-form-select"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ds-form-field ds-form-field--full">
                <span className="ds-form-label">Bio</span>
                <textarea
                  className="ds-form-textarea"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Location</span>
                <input
                  className="ds-form-input"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Date of Birth</span>
                <input
                  className="ds-form-input"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="ds-form-field">
                <span className="ds-form-label">Join Date</span>
                <input
                  className="ds-form-input"
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>
            </div>

            {isEditing ? (
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="ds-secondary-btn"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ds-inline-primary-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
