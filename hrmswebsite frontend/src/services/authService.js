
const API_BASE_URL = 'http://localhost:8080/api/auth';

async function request(endpoint, data) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(
      'Cannot connect to the HRMS backend. Make sure Spring Boot is running on port 8080.'
    );
  }

  const responseText = await response.text();
  let result = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }
  }

  if (!response.ok) {
    const message =
      result.message ||
      result.detail ||
      result.error ||
      result.title ||
      (typeof result === 'string' ? result : null) ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return result;
}

export async function registerUser(data) {
  const payload = {
    fullName: (data.fullName || data.name || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    password: data.password || '',
  };

  if (!payload.fullName || !payload.email || !payload.password) {
    throw new Error('Please enter your full name, email, and password.');
  }

  return request('register', payload);
}

export async function loginUser(data) {
  const result = await request('login', {
    email: data.email,
    password: data.password,
    ...(data.role ? { role: data.role } : {}),
  });

  const token = result.token || result.accessToken;

  if (!token) {
    throw new Error(
      'Login response did not contain a JWT token. Check AuthResponse.java.'
    );
  }

  const backendUser = result.user || {};

  const user = {
    userId: result.userId ?? backendUser.userId ?? backendUser.id,
    fullName: result.fullName ?? backendUser.fullName ?? backendUser.name,
    email: result.email ?? backendUser.email ?? data.email,
    role: result.role ?? backendUser.role,
  };

  sessionStorage.setItem('hrms-token', token);
  sessionStorage.setItem('hrms-user', JSON.stringify(user));

  return {
    ...result,
    ...user,
    token,
  };
}

export async function requestPasswordReset(email) {
  return request('forgot-password', {
    email: email.trim().toLowerCase(),
  });
}

export async function resetPassword(token, newPassword) {
  return request('reset-password', {
    token,
    newPassword,
  });
}

export function logoutUser() {
  sessionStorage.removeItem('hrms-token');
  sessionStorage.removeItem('hrms-user');
}
