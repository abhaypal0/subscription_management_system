import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { authService } from '../../services/auth.service'
import Button from '../../components/common/Button'

export const VerifyEmail = () => {
  const { token } = useParams()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token)
        if (isMounted) {
          setStatus('success')
          setMessage(response.message || 'Email verified successfully! You can now log in.')
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error')
          setMessage(
            err.response?.data?.message || 'Verification link is invalid or has expired.'
          )
        }
      }
    }

    if (token) {
      verify()
    } else {
      setStatus('error')
      setMessage('Missing verification token.')
    }

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 text-center"
      >
        {status === 'verifying' && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Verifying Your Email...
            </h2>
            <p className="text-sm text-slate-500">
              Please wait while we validate your activation token.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-sm text-slate-600 mb-6">{message}</p>
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Continue to Sign In
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-sm text-slate-600 mb-6">{message}</p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default VerifyEmail
