
import React, { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }

    try {
      setLoading(true)

      const response = await authService.resetPassword(
        token,
        password,
        confirmPassword
      )

      toast.success(response.message || 'Password reset successfully')

      setTimeout(() => navigate('/login'), 1500)
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to reset password'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Reset Password
        </h1>

        <p className="mb-6 text-sm text-slate-400">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={9}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={9}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="Confirm new password"
            />
          </div>

          <p className="text-xs text-slate-400">
            Use at least 9 characters, including uppercase, lowercase and a special character.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-400 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
