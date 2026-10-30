
const API_URL = 'http://localhost:8080/api/mail'

function getToken() {
  return (
    sessionStorage.getItem('hrms-token') ||
    localStorage.getItem('hrms-token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('token')
  )
}

async function request(endpoint, options = {}) {
  const token = getToken()

  if (!token) {
    throw new Error('Please log in again to access HRMS mail.')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}`
    )
  }

  return data
}

export function getInbox() {
  return request('/inbox')
}

export function getSentMail() {
  return request('/sent')
}

export function sendMail(mail) {
  return request('/send', {
    method: 'POST',
    body: JSON.stringify(mail)
  })
}

export function markMailAsRead(id) {
  return request(`/${id}/read`, {
    method: 'POST'
  })
}
