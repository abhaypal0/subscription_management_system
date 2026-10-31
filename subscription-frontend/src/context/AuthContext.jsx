import React, { createContext, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { loginUser, logoutUser } from '../store/slices/authSlice'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch()
  const { user, role, isAuthenticated, isLoading, isCheckingAuth, error } = useSelector(
    (state) => state.auth
  )

  const login = (credentials) => dispatch(loginUser(credentials))
  const logout = () => dispatch(logoutUser())

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        isCheckingAuth,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
