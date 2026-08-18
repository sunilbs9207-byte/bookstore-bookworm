// Base API configuration
const BASE_URL = 'http://localhost:5000/api'
// Get token from localStorage
const getToken = () => localStorage.getItem('token')
// Base fetch with auth header
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  // Handle unauthorized
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'API request failed')
  }
  return data
}
export default apiFetch