
const API_URL = 'http://localhost:8080/api/performance/reviews'

const getToken = () => {
  const token = sessionStorage.getItem('hrms-token')

  if (!token) {
    throw new Error('Your session has expired. Please log in again.')
  }

  return token
}

const request = async (endpoint = '', options = {}) => {
  const token = getToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed (${response.status})`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const getPerformanceReviews = () => request()

export const getEmployeePerformanceReviews = (employeeId) =>
  request(`/employee/${employeeId}`)

export const createPerformanceReview = (employeeId, review) =>
  request(`?employeeId=${encodeURIComponent(employeeId)}`, {
    method: 'POST',
    body: JSON.stringify(review)
  })

export const updatePerformanceReview = (reviewId, review) =>
  request(`/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(review)
  })

export const deletePerformanceReview = (reviewId) =>
  request(`/${reviewId}`, {
    method: 'DELETE'
  })
