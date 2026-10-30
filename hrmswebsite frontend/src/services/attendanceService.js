const API_BASE_URL = "http://localhost:8080/api";
const API_URL = `${API_BASE_URL}/attendance`;
function getHeaders() {
  const token = sessionStorage.getItem("hrms-token");
  if (!token) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}
async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to the HRMS backend. Make sure Spring Boot is running on port 8080."
    );
  }
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (response.status === 401) {
    const serverMessage =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.detail ||
          data?.error;
    throw new Error(
      `Authentication failed for ${new URL(url).pathname}: ${
        serverMessage || "The server rejected the request."
      }`
    );
  }
  if (response.status === 403) {
    const message =
      typeof data === "string"
        ? data
        : data?.detail ||
          data?.message ||
          data?.error;
    throw new Error(
      message ||
        `You do not have permission to access ${new URL(url).pathname}.`
    );
  }
  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.detail ||
          data?.message ||
          data?.error;
    throw new Error(
      message ||
        `Request failed (${response.status}) at ${new URL(url).pathname}.`
    );
  }
  return data;
}
const attendanceService = {
  getMyEmployee() {
    return request(`${API_BASE_URL}/employee-identity/me`);
  },
  checkIn(employeeId) {
    return request(
      `${API_URL}/check-in/${encodeURIComponent(employeeId)}`,
      {
        method: "POST",
      }
    );
  },
  checkOut(employeeId) {
    return request(
      `${API_URL}/check-out/${encodeURIComponent(employeeId)}`,
      {
        method: "POST",
      }
    );
  },

  getAll() {
    return request(API_URL);
  },

  getByEmployee(employeeId) {
    return request(
      `${API_URL}/employee/${encodeURIComponent(employeeId)}`
    );
  },

  getByDate(date) {
    return request(
      `${API_URL}/date/${encodeURIComponent(date)}`
    );
  },

  getByRange(employeeId, startDate, endDate) {
    const query = new URLSearchParams({
      startDate,
      endDate,
    });

    return request(
      `${API_URL}/employee/${encodeURIComponent(employeeId)}/range?${query}`
    );
  },

  getPresentDays(employeeId) {
    return request(
      `${API_URL}/employee/${encodeURIComponent(employeeId)}/present-days`
    );
  },
};

export default attendanceService;
