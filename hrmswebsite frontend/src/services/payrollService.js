
const API_URL = "http://localhost:8080/api";
const PAYROLL_URL = `${API_URL}/payroll`;

const getToken = () =>
  sessionStorage.getItem("hrms-token") ||
  localStorage.getItem("hrms-token") ||
  sessionStorage.getItem("token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("authToken");

const request = async (url, options = {}) => {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText || `Request failed (${response.status})`;

    try {
      const parsed = JSON.parse(responseText);
      message = parsed.message || parsed.error || message;
    } catch {
      message = responseText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const getAll = () => request(PAYROLL_URL);

const getMy = () => request(`${PAYROLL_URL}/my`);

const getByStatus = (status) =>
  request(`${PAYROLL_URL}?status=${encodeURIComponent(status)}`);

const getByMonth = (month, year) =>
  request(
    `${PAYROLL_URL}?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
  );

const getSummary = () => request(`${PAYROLL_URL}/summary`);

const getEmployees = () => request(`${API_URL}/employees`);

const create = (payroll) =>
  request(PAYROLL_URL, {
    method: "POST",
    body: JSON.stringify(payroll),
  });

const markAsPaid = (id) =>
  request(`${PAYROLL_URL}/${id}/paid`, {
    method: "PATCH",
  });

const markAsPending = (id) =>
  request(`${PAYROLL_URL}/${id}/pending`, {
    method: "PATCH",
  });

const payrollService = {
  getAll,
  getMy,
  getByStatus,
  getByMonth,
  getSummary,
  getEmployees,
  create,
  markAsPaid,
  markAsPending,
  getAllPayrolls: getAll,
  getMyPayrolls: getMy,
  getPayrollSummary: getSummary,
  createPayroll: create,
};

export default payrollService;
