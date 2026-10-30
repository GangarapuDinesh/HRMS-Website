import { useEffect, useRef, useState } from "react";
import { FiUser,FiCamera,FiTrash2,FiSave,FiMapPin,FiBriefcase,FiMail,FiPhone,FiCheckCircle,FiAlertCircle,FiLoader,} from "react-icons/fi";
import profileService from "../../services/profileService";
import "./Settings.css";
function Settings({ onProfileUpdated }) {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
    location: "",
  });
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  function notifyProfileUpdated(data, photoFallback = profilePhoto) {
    const updatedProfile = {
      ...data,
      fullName: data?.fullName ?? profile.fullName,
      email: data?.email ?? profile.email,
      phone: data?.phone ?? profile.phone,
      jobTitle: data?.jobTitle ?? profile.jobTitle,
      department: data?.department ?? profile.department,
      location: data?.location ?? profile.location,
      profilePhoto:
        data?.profilePhoto !== undefined
          ? data.profilePhoto || ""
          : photoFallback || "",
    };

    onProfileUpdated?.(updatedProfile);
    return updatedProfile;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await profileService.getMyProfile();

        if (cancelled) return;

        const updatedProfile = {
          fullName: data?.fullName || "",
          email: data?.email || "",
          phone: data?.phone || "",
          jobTitle: data?.jobTitle || "",
          department: data?.department || "",
          location: data?.location || "",
        };

        setProfile(updatedProfile);
        setProfilePhoto(data?.profilePhoto || "");

        onProfileUpdated?.({
          ...data,
          ...updatedProfile,
          profilePhoto: data?.profilePhoto || "",
        });
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || "Unable to load your profile.");
          setMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [onProfileUpdated]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const data = await profileService.updateMyProfile(profile);

      const updatedProfile = {
        ...profile,
        ...data,
        fullName: data?.fullName ?? profile.fullName,
        email: data?.email ?? profile.email,
        phone: data?.phone ?? profile.phone,
        jobTitle: data?.jobTitle ?? profile.jobTitle,
        department: data?.department ?? profile.department,
        location: data?.location ?? profile.location,
        profilePhoto:
          data?.profilePhoto !== undefined
            ? data.profilePhoto || ""
            : profilePhoto,
      };

      setProfile({
        fullName: updatedProfile.fullName || "",
        email: updatedProfile.email || "",
        phone: updatedProfile.phone || "",
        jobTitle: updatedProfile.jobTitle || "",
        department: updatedProfile.department || "",
        location: updatedProfile.location || "",
      });

      setProfilePhoto(updatedProfile.profilePhoto);
      notifyProfileUpdated(updatedProfile, updatedProfile.profilePhoto);

      setMessage("Your profile has been saved successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Unable to save your profile.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Choose a JPG, PNG or WebP image.");
      setMessageType("error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Your profile photo must be 2 MB or smaller.");
      setMessageType("error");
      return;
    }

    setPhotoLoading(true);
    setMessage("");

    try {
      const data = await profileService.uploadPhoto(file);
      const updatedPhoto = data?.profilePhoto || "";

      setProfilePhoto(updatedPhoto);

      notifyProfileUpdated(
        {
          ...data,
          profilePhoto: updatedPhoto,
        },
        updatedPhoto
      );

      setMessage("Profile photo uploaded successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Unable to upload your photo.");
      setMessageType("error");
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handleDeletePhoto() {
    if (!profilePhoto) return;

    setPhotoLoading(true);
    setMessage("");

    try {
      const data = await profileService.deletePhoto();

      setProfilePhoto("");

      notifyProfileUpdated(
        {
          ...data,
          profilePhoto: "",
        },
        ""
      );

      setMessage("Profile photo deleted successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Unable to delete your photo.");
      setMessageType("error");
    } finally {
      setPhotoLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="settings-page">
        <div className="settings-loading">
          <FiLoader className="settings-spinner" />
          <p>Loading your profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-page">
      <div className="settings-heading">
        <div>
          <span className="settings-eyebrow">ACCOUNT PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your profile and personal information.</p>
        </div>

        <div className="settings-heading-icon">
          <FiUser />
        </div>
      </div>

      {message && (
        <div className={`settings-message ${messageType}`} role="status">
          {messageType === "success" ? (
            <FiCheckCircle />
          ) : (
            <FiAlertCircle />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-profile-card">
          <div className="settings-photo-wrapper">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Your profile"
                className="settings-profile-photo"
                onError={() => {
                  setMessage("Your profile photo could not be displayed.");
                  setMessageType("error");
                }}
              />
            ) : (
              <div className="settings-profile-initials">
                {(profile.fullName || "U").trim().charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              className="settings-photo-camera"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload profile photo"
              disabled={photoLoading}
            >
              <FiCamera />
            </button>
          </div>

          <h2>{profile.fullName || "Your name"}</h2>
          <p className="settings-profile-email">{profile.email}</p>

          <span className="settings-profile-role">
            {profile.jobTitle || "HRFlow member"}
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="settings-file-input"
            onChange={handlePhotoChange}
          />

          <button
            type="button"
            className="settings-upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
          >
            {photoLoading ? (
              <FiLoader className="settings-spinner" />
            ) : (
              <FiCamera />
            )}
            {photoLoading
              ? "Processing..."
              : profilePhoto
                ? "Change photo"
                : "Upload photo"}
          </button>

          {profilePhoto && (
            <button
              type="button"
              className="settings-delete-photo"
              onClick={handleDeletePhoto}
              disabled={photoLoading}
            >
              <FiTrash2 /> Delete photo
            </button>
          )}

          <p className="settings-photo-hint">
            JPG, PNG or WebP. Maximum file size: 2 MB.
          </p>
        </aside>

        <form className="settings-form-card" onSubmit={handleSave}>
          <div className="settings-form-heading">
            <div>
              <h2>Profile information</h2>
              <p>Update the details displayed on your HRFlow dashboard.</p>
            </div>

            <span className="settings-section-icon">
              <FiUser />
            </span>
          </div>

          <div className="settings-fields-grid">
            <label className="settings-field">
              <span>Full name *</span>
              <div className="settings-input-wrapper">
                <FiUser />
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  maxLength={100}
                  required
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Email address *</span>
              <div className="settings-input-wrapper">
                <FiMail />
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  maxLength={150}
                  required
                />
              </div>
              <small>
                Changing this email also changes your login email.
              </small>
            </label>

            <label className="settings-field">
              <span>Phone number</span>
              <div className="settings-input-wrapper">
                <FiPhone />
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  maxLength={30}
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Job title</span>
              <div className="settings-input-wrapper">
                <FiBriefcase />
                <input
                  type="text"
                  name="jobTitle"
                  value={profile.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Software Developer"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Department</span>
              <div className="settings-input-wrapper">
                <FiBriefcase />
                <input
                  type="text"
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  placeholder="e.g. Engineering"
                  maxLength={100}
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Location</span>
              <div className="settings-input-wrapper">
                <FiMapPin />
                <input
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="City or work location"
                  maxLength={150}
                />
              </div>
            </label>
          </div>

          <div className="settings-form-footer">
            <p>* Required fields</p>

            <button
              type="submit"
              className="settings-save-button"
              disabled={saving}
            >
              {saving ? (
                <FiLoader className="settings-spinner" />
              ) : (
                <FiSave />
              )}
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Settings;
