
const API_BASE_URL = "http://localhost:8080/api/leaves";

function getAuthToken() {
  return (
    sessionStorage.getItem("hrms-token") ||
    localStorage.getItem("hrms-token")
  );
}

async function request(url, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const responseText = await response.text();

  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || `Request failed (${response.status})`;

    throw new Error(message);
  }

  if (response.status === 204 || !responseText) {
    return null;
  }

  return data;
}

const leaveService = {
  applyForLeave(data) {
    return request("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyLeaves() {
    return request("/my");
  },

  getMyLeaveCounts() {
    return request("/my/counts");
  },

  getAllLeaves(status) {
    const query = status
      ? `?status=${encodeURIComponent(status)}`
      : "";

    return request(query);
  },

  reviewLeave(id, decision, comment = "") {
    return request(`/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ decision, comment }),
    });
  },
};

export default leaveService;
