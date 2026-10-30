
const API_URL = "http://localhost:8080/api/documents";

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

  const headers = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Do not set Content-Type for FormData.
  // The browser must generate the multipart boundary.
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();
      message =
        data.message ||
        data.detail ||
        data.error ||
        message;
    } catch {
      // Keep the fallback message if the response is not JSON.
    }

    if (response.status === 401) {
      message = "Your session has expired. Please log in again.";
    } else if (response.status === 403) {
      message = "You do not have permission to access these documents.";
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response;
}

const documentService = {
  async uploadDocument(employeeId, file, documentType) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await request(
      `${API_URL}/employees/${employeeId}`,
      {
        method: "POST",
        body: formData,
      }
    );

    return response.json();
  },

  async getEmployeeDocuments(employeeId) {
    const response = await request(
      `${API_URL}/employees/${employeeId}`
    );

    return response.json();
  },

  async downloadDocument(documentId) {
    const response = await request(
      `${API_URL}/${documentId}/download`
    );

    return response.blob();
  },

  async deleteDocument(documentId) {
    await request(`${API_URL}/${documentId}`, {
      method: "DELETE",
    });

    return true;
  },
};

export default documentService;
