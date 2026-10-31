import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, User, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { authService } from '../../services/auth.service'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import toast from 'react-hot-toast'

export const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Real-time password criteria
  const hasMinLen = formData.password.length >= 9
  const hasUpper = /[A-Z]/.test(formData.password)
  const hasLower = /[a-z]/.test(formData.password)
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password)

  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasSpecial

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isPasswordValid) {
      toast.error(
        'Password must have 9+ chars, an uppercase letter, a lowercase letter, and a special character.'
      )
      return
    }

    setIsLoading(true)
    try {
      await authService.register(formData)
      setIsSuccess(true)
      toast.success('Registration successful!')
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Registration failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-semibold text-slate-800">{formData.email}</span>.
            Please click the link in your inbox to verify your account and activate your login.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100"
      >
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create an Account
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Get started 
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="fullname"
            required
            placeholder="John Doe"
            icon={User}
            value={formData.fullname}
            onChange={handleChange}
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            required
            placeholder="Minimum 9 characters"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
          />

          {/* Password rule checklist */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1.5 text-slate-600">
            <p className="font-semibold text-slate-700">Password requirements:</p>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <span className={hasMinLen ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                ✓ 9+ characters
              </span>
              <span className={hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                ✓ Uppercase letter
              </span>
              <span className={hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                ✓ Lowercase letter
              </span>
              <span className={hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                ✓ Special symbol
              </span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
            disabled={!isPasswordValid || !formData.fullname || !formData.email}
          >
            Create Account
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Register
