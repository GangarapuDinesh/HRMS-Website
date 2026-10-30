
const API_BASE_URL = 'http://localhost:8080/api/employees';

async function employeeRequest(endpoint = '', options = {}) {
  const token = sessionStorage.getItem('hrms-token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const responseText = await response.text();
  let result = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Your session has expired or authentication failed. Please log in again.'
      );
    }

    if (response.status === 403) {
      throw new Error(
        'Access denied. Employee management requires an Admin or HR Manager account.'
      );
    }

    if (response.status === 404) {
      throw new Error(
        result?.message ||
          'Employee endpoint or employee record was not found.'
      );
    }

    if (response.status === 409) {
      throw new Error(
        result?.message ||
          'An employee with this email already exists.'
      );
    }

    if (response.status === 400) {
      throw new Error(
        result?.message ||
          'Invalid employee details. Please check the form.'
      );
    }

    throw new Error(
      result?.message ||
        result?.detail ||
        `Employee request failed (${response.status}).`
    );
  }

  return result;
}
export function getEmployees() {
  return employeeRequest();
}
export function getMyEmployeeRecord() {
  return employeeRequest('/me');
}

export function getEmployeeById(id) {
  return employeeRequest(`/${encodeURIComponent(id)}`);
}
export function createEmployee(employee) {
  return employeeRequest('', {
    method: 'POST',
    body: JSON.stringify(employee),
  });
}
export function updateEmployee(id, employee) {
  return employeeRequest(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(employee),
  });
}
export function deactivateEmployee(id) {
  return employeeRequest(`/${encodeURIComponent(id)}/deactivate`, {
    method: 'PATCH',
  });
}
