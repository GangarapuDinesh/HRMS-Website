
const API_URL = "http://localhost:8080/api/recruitment/jobs";
const RECRUITMENT_API_URL = "http://localhost:8080/api/recruitment";

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

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      data?.message ||
        data?.detail ||
        data?.error ||
        (response.status === 401
          ? "Your session has expired. Please log in again."
          : response.status === 403
            ? "You do not have permission to perform this action."
            : `Request failed (${response.status})`)
    );
  }

  return data;
}

const recruitmentService = {
   getJobs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) {
      params.set("status", filters.status);
    }
    if (filters.department) {
      params.set("department", filters.department);
    }
    const query = params.toString();
    return request(`${API_URL}${query ? `?${query}` : ""}`);
  },
  getJob(id) {
    return request(`${API_URL}/${id}`);
  },
  createJob(job) {
    return request(API_URL, {
      method: "POST",
      body: JSON.stringify(job),
    });
  },
  updateJob(id, job) {
    return request(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(job),
    });
  },
  closeJob(id) {
    return request(`${API_URL}/${id}/close`, {
      method: "PATCH",
    });
  },
  deleteJob(id) {
    return request(`${API_URL}/${id}`, {
      method: "DELETE",
    });
  },
  applyForJob(jobId, coverLetter = "") {
    return request(`${API_URL}/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({
        coverLetter,
      }),
    });
  },
  getMyApplications() {
    return request(`${RECRUITMENT_API_URL}/applications/my`);
  },
  getApplicants(jobId) {
    return request(`${API_URL}/${jobId}/applications`);
  },
  updateApplicationStatus(applicationId, status) {
    return request(
      `${RECRUITMENT_API_URL}/applications/${applicationId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      }
    );
  },
};
export default recruitmentService;
