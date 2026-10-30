const API_BASE = "http://localhost:8080/api/profile";

function getToken() {
  return (
    sessionStorage.getItem("hrms-token") ||
    localStorage.getItem("hrms-token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
}

async function request(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message || data?.detail || `Request failed (${response.status})`
    );
  }

  if (data?.token) {
    const storage = sessionStorage.getItem("hrms-token") !== null
      ? sessionStorage
      : localStorage.getItem("hrms-token") !== null
        ? localStorage
        : sessionStorage;

    storage.setItem("hrms-token", data.token);
  }

  return data;
}

const profileService = {
  getMyProfile() {
    return request(`${API_BASE}/me`);
  },

  updateMyProfile(profile) {
    return request(`${API_BASE}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });
  },

  uploadPhoto(file) {
    const formData = new FormData();
    formData.append("photo", file);

    return request(`${API_BASE}/me/photo`, {
      method: "POST",
      body: formData,
    });
  },

  deletePhoto() {
    return request(`${API_BASE}/me/photo`, {
      method: "DELETE",
    });
  },
};

export default profileService;