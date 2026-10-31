// Password must contain at least 9 characters, one uppercase, one lowercase, and one special character
export const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/
  return regex.test(password)
}

// Basic email format check
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(String(email).toLowerCase())
}
