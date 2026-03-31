'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Zap, Code, Box, Building2, Check } from 'lucide-react'

const featureCards = [
  { title: 'Free to use', subtitle: 'No credit card', icon: Zap },
  { title: 'AI-powered', subtitle: 'Claude API', icon: Code },
  { title: 'Mechanical', subtitle: 'Parts & assemblies', icon: Box },
  { title: 'Architectural', subtitle: 'Layouts & structures', icon: Building2 },
]

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading, register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 'weak', percent: 0, label: '' }
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 10) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++

    if (strength <= 1) return { level: 'weak', percent: 33, label: 'Weak' }
    if (strength <= 3) return { level: 'medium', percent: 66, label: 'Medium' }
    return { level: 'strong', percent: 100, label: 'Strong' }
  }

  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = password && confirm && password === confirm

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service')
      return
    }
    setSubmitting(true)
    try {
      await register(email, password)
      setSuccess(true)
      setTimeout(() => {
        toast.success('Account created! Welcome to OptiForge AI.')
        router.push('/dashboard')
      }, 500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-20 right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}} />
      <div className="absolute bottom-40 left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}} />

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-gradient-to-br from-[#1a1560] via-[#120d45] to-[#0a0a0f] p-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 font-bold text-white text-3xl select-none shadow-lg shadow-indigo-600/30">
            O
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">OptiForge AI</span>
        </div>

        {/* Main content */}
        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold leading-tight text-balance mb-4">
              <span className="text-white">Start building</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                smarter designs.
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-md">
              Join thousands of engineering students optimizing designs with AI
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-2 gap-4">
            {featureCards.map((feature, idx) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={idx}
                  className="bg-white/[0.03] backdrop-blur-md border border-white/[0.1] rounded-xl p-4 hover:bg-white/[0.05] transition-all group cursor-pointer"
                >
                  <IconComponent size={24} className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                  <p className="text-white/50 text-xs mt-1">{feature.subtitle}</p>
                </div>
              )
            })}
          </div>

          {/* Workflow arrow */}
          <div className="flex items-center gap-3 text-white/60 text-sm">
            <span>Describe</span>
            <ArrowRight size={18} className="text-indigo-400 animate-pulse" />
            <span>Generate</span>
            <ArrowRight size={18} className="text-indigo-400 animate-pulse" style={{animationDelay: '0.3s'}} />
            <span>Optimize</span>
          </div>
        </div>

        <p className="text-white/30 text-xs">
          &copy; {new Date().getFullYear()} OptiForge AI. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Glass-morphism card effect */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-8 shadow-2xl">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 font-bold text-white text-sm shadow-lg shadow-indigo-600/30">
                O
              </div>
              <span className="font-bold text-white">OptiForge AI</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
            <p className="text-white/50 text-sm mb-8">
              Get started with OptiForge AI for free
            </p>

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 backdrop-blur border border-red-500/30 rounded-lg px-4 py-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success state */}
            {success && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/10 backdrop-blur border border-emerald-500/30 rounded-lg px-4 py-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <p className="text-emerald-400 text-sm">Account created!</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-medium" htmlFor="fullname">
                  Full name
                </label>
                <div className="relative">
                  <input
                    id="fullname"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 pl-11 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-medium" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 pl-11 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Password with strength indicator */}
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 pl-11 pr-11 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.level === 'weak' ? 'text-red-400' :
                        passwordStrength.level === 'medium' ? 'text-yellow-400' :
                        'text-emerald-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.level === 'weak' ? 'bg-red-500/70 w-1/3' :
                          passwordStrength.level === 'medium' ? 'bg-yellow-500/70 w-2/3' :
                          'bg-emerald-500/70 w-full'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password with matching indicator */}
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-medium" htmlFor="confirm">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 pl-11 pr-11 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {confirm && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordsMatch ? (
                        <Check size={18} className="text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-red-400 rounded-full" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3 py-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border border-white/[0.2] bg-white/[0.05] accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-white/60 cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Create Account button */}
              <button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 mt-6"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 size={18} />
                    Account created!
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Sign in link */}
            <p className="text-center text-white/50 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
