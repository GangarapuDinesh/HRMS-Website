const API_BASE = "http://localhost:8080/api/performance/tasks";
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
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }
  return response.json();
}
export function getAllTasks() {
  return request("");
}
export function getMyTasks() {
  return request("/my");
}
export function getEmployeeTasks(employeeId) {
  return request(`/employee/${employeeId}`);
}
export function getTask(taskId) {
  return request(`/${taskId}`);
}
export function createTask(employeeId, task) {
  return request(`?employeeId=${encodeURIComponent(employeeId)}`, {
    method: "POST",
    body: JSON.stringify(task)
  });
}
export function updateTask(taskId, task) {
  return request(`/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(task)
  });
}
export function updateTaskProgress(taskId, progress, submissionNotes) {
  return request(`/${taskId}/progress`, {
    method: "PUT",
    body: JSON.stringify({ progress, submissionNotes })
  });
}
export function reviewTask(
  taskId,
  decision,
  reviewerFeedback,
  performanceRating
) {
  return request(`/${taskId}/review`, {
    method: "PUT",
    body: JSON.stringify({
      decision,
      reviewerFeedback,
      performanceRating
    })
  });
}

export function deleteTask(taskId) {
  return request(`/${taskId}`, {
    method: "DELETE"
  });
}
