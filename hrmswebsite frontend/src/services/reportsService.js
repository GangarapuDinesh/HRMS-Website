
const API_URL = 'http://localhost:8080/api/reports'

export async function getReportsSummary(startDate, endDate) {
  const token = sessionStorage.getItem('hrms-token')

  if (!token) {
    throw new Error('Please log in again to view reports.')
  }

  const params = new URLSearchParams({
    startDate,
    endDate
  })

  const response = await fetch(`${API_URL}/summary?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  })

  if (response.status === 401) {
    throw new Error('Your session has expired. Please log in again.')
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to view HR reports.')
  }

  if (!response.ok) {
    throw new Error(`Failed to load reports (${response.status}).`)
  }

  return response.json()
}
