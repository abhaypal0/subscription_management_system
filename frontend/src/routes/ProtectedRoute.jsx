import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { ShieldAlert } from 'lucide-react'
import Button from '../components/common/Button'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation()
  const { isAuthenticated, isCheckingAuth, role } = useSelector(
    (state) => state.auth
  )

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Validating session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Your current role (<span className="font-semibold text-slate-700 uppercase">{role}</span>) does not have permission to view this section.
        </p>
        <Button onClick={() => window.history.back()} variant="secondary">
          Go Back
        </Button>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
