import apiFetch from './api'
// Register
export const register = async (name, email, password) => {
  return await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}
// Login
export const login = async (email, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  // Save token and user to localStorage
  if (data.token) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }
  return data
}
// Logout
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
// Get profile
export const getProfile = async () => {
  return await apiFetch('/auth/profile')
}
// Get stored user
export const getStoredUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}
// Check if logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}