
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { authService } from '../../services/auth.service'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    try {
      setIsLoading(true)

      const response = await authService.forgotPassword(email.trim())

      toast.success(response.message || 'Check your email for the reset link')
      setSubmitted(true)
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        'Unable to process request. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Forgot Password?
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Enter your registered email address and we'll send you a password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="w-7 h-7 text-green-600" />
            </div>

            <h3 className="font-semibold text-slate-800">
              Check Your Email
            </h3>

            <p className="text-sm text-slate-500">
              If an account exists with {email}, a password reset link has been sent.
            </p>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => setSubmitted(false)}
            >
              Try Another Email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
