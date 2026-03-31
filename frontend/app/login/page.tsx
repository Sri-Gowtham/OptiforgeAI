'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Eye, EyeOff, Zap, Cog, Layers, AlertCircle, CheckCircle2 } from 'lucide-react'

const features = [
  { icon: Zap, label: 'Instant AI design analysis' },
  { icon: Cog, label: 'Material & structural optimization' },
  { icon: Layers, label: 'Cost-efficient design generation' },
]

const stats = [
  { value: '500+', label: 'Designs Optimized' },
  { value: '200+', label: 'Students' },
  { value: 'Free', label: 'to Use' },
]

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      setSuccess(true)
      setTimeout(() => {
        toast.success('Welcome back!')
        router.push('/dashboard')
      }, 500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
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
        <div className="space-y-12">
          <div>
            <h1 className="text-5xl font-bold leading-tight text-balance mb-4">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Design smarter,
              </span>
              <br />
              <span className="text-white">build better.</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-md">
              AI-powered industrial design optimization for engineering students
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon
              const colors = ['text-indigo-400', 'text-purple-400', 'text-cyan-400']
              return (
                <div key={idx} className="flex items-center gap-4">
                  <IconComponent size={24} className={colors[idx]} />
                  <span className="text-white/80 text-sm font-medium">{feature.label}</span>
                </div>
              )
            })}
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-8 border-t border-white/10">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-white font-bold text-lg">{stat.value}</span>
                <span className="text-white/50 text-xs uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
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
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-white/50 text-sm mb-8">
              Sign in to your account to continue
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
                <p className="text-emerald-400 text-sm">Redirecting...</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-medium" htmlFor="fullname">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 pl-11 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/70 font-medium" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
              </div>

              <button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 size={18} />
                    Welcome!
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-white/40 text-xs uppercase tracking-widest">or continue with</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="w-full bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              Continue with Google
            </button>

            {/* Sign up link */}
            <p className="text-center text-white/50 text-sm mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
