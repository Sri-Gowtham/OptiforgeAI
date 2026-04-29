'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { authAPI } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import {
  Settings,
  FolderOpen,
  RefreshCw,
  Sparkles,
  Check,
  Lock,
  Calendar,
  Copy,
  LogOut,
  Trash2,
  BarChart3,
  Box,
  Users,
  Store,
  Smartphone,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProfileData {
  email: string
  joinedAt: string
  projectsCount: number
  analysesCount: number
  designsCount: number
}

function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse`} />
}

const features = [
  { label: 'Unlimited project creation', included: true },
  { label: 'AI design generation (mechanical & architectural)', included: true },
  { label: 'AI optimization & analysis', included: true },
  { label: 'Cost estimation (Bill of Materials)', included: true },
  { label: 'Design export (PNG, PDF, SVG)', included: true },
  { label: 'AI chat assistant', included: true },
  { label: 'Manual CAD editor (Beta)', included: true },
  { label: '3D Preview', included: false },
  { label: 'Team Collaboration', included: false },
  { label: 'Design Marketplace', included: false },
]

const roadmap = [
  { quarter: 'Q2 2026', feature: '3D Preview', icon: Box, color: 'text-purple-400' },
  { quarter: 'Q3 2026', feature: 'Team Collaboration', icon: Users, color: 'text-blue-400' },
  { quarter: 'Q4 2026', feature: 'Design Marketplace', icon: Store, color: 'text-green-400' },
  { quarter: '2027', feature: 'Mobile App', icon: Smartphone, color: 'text-gray-400' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [dangerExpanded, setDangerExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    authAPI
      .getProfile()
      .then((data) => setProfile({ ...data, designsCount: data.analysesCount }))
      .finally(() => setFetchLoading(false))
  }, [user])

  function handleLogout() {
    logout()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  function handleCopyAccountId() {
    if (!user) return
    const truncated = user.email.split('@')[0].slice(0, 12) + '…'
    navigator.clipboard.writeText(user.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Account ID copied')
  }

  if (loading || !user) return null

  const initial = user.email.charAt(0).toUpperCase()
  const username = user.email.split('@')[0]
  const joinDate = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {/* Profile Hero Card */}
          <div className="bg-gradient-to-br from-indigo-600/5 to-purple-600/5 border border-gray-200 dark:border-white/[0.08] rounded-2xl p-8 mb-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Avatar with animation */}
              <style>{`
                @keyframes avatarPing {
                  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
                  70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
                }
                .avatar-ring {
                  animation: avatarPing 2s infinite;
                }
              `}</style>
              <div className="avatar-ring w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
                {initial}
              </div>

              {/* Info */}
              <div>
                {fetchLoading ? (
                  <div className="space-y-3">
                    <SkeletonLine w="w-32" h="h-6" />
                    <SkeletonLine w="w-48" h="h-4" />
                    <SkeletonLine w="w-40" h="h-4" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{username}</h1>
                    <p className="text-gray-500 dark:text-white/50 text-sm mb-3">{user.email}</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-white/40" />
                      <span className="text-white/50 text-xs">Member since {joinDate}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Badge and Edit Button */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 border border-indigo-600/50 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-indigo-300 text-xs font-semibold">Free Plan</span>
              </span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 hover:text-white/80 hover:bg-white/[0.05] transition-all text-xs font-medium border border-white/[0.1]">
                <Settings size={14} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-indigo-600/20 text-indigo-400">
                  <FolderOpen size={20} />
                </div>
                <p className="text-gray-500 dark:text-white/50 text-xs font-medium">Projects Created</p>
              </div>
              {fetchLoading ? (
                <SkeletonLine w="w-12" h="h-8" />
              ) : (
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{profile?.projectsCount ?? 0}</p>
              )}
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-purple-600/20 text-purple-400">
                  <RefreshCw size={20} />
                </div>
                <p className="text-gray-500 dark:text-white/50 text-xs font-medium">Analyses Run</p>
              </div>
              {fetchLoading ? (
                <SkeletonLine w="w-12" h="h-8" />
              ) : (
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{profile?.analysesCount ?? 0}</p>
              )}
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-cyan-600/20 text-cyan-400">
                  <Sparkles size={20} />
                </div>
                <p className="text-gray-500 dark:text-white/50 text-xs font-medium">Designs Generated</p>
              </div>
              {fetchLoading ? (
                <SkeletonLine w="w-12" h="h-8" />
              ) : (
                <p className="text-4xl font-bold text-white">{profile?.designsCount ?? 0}</p>
              )}
            </div>
          </div>

          {/* Account Information Card */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden mb-8">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.01]">
              <Settings size={16} className="text-gray-500 dark:text-white/60" />
              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Account Information</h3>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {/* Email */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-1">Email</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{user.email}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30 flex items-center gap-1">
                  <Check size={12} />
                  Verified
                </span>
              </div>

              {/* Account ID */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-1">Account ID</p>
                  <p className="text-gray-600 dark:text-white/70 font-mono text-xs">{user.email.split('@')[0].slice(0, 12)}…</p>
                </div>
                <button
                  onClick={handleCopyAccountId}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium border',
                    copied
                      ? 'bg-green-500/15 border-green-500/30 text-green-400'
                      : 'bg-white/[0.05] border-white/[0.1] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
                  )}
                >
                  <Copy size={12} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Plan */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-1">Plan</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">Free</p>
                </div>
                <button className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors">
                  Upgrade
                </button>
              </div>

              {/* Member Since */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-1">Member Since</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{joinDate}</p>
                </div>
              </div>

              {/* Last Active */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-1">Last Active</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Features Card */}
          <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={18} className="text-indigo-400" />
              <h3 className="text-white font-semibold">Your Features</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex items-start gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02]"
                >
                  {f.included ? (
                    <Check size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  ) : (
                    <Lock size={16} className="text-white/30 shrink-0 mt-0.5" />
                  )}
                  <span className={cn('text-sm', f.included ? 'text-white/70' : 'text-white/40')}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Features Roadmap */}
          <div className="bg-purple-600/10 border border-purple-600/20 rounded-2xl p-8 mb-8">
            <h3 className="text-white font-semibold text-base mb-6">Upcoming Features</h3>

            <div className="space-y-4">
              {roadmap.map(({ quarter, feature, icon: Icon, color }) => (
                <div key={quarter} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="px-2.5 py-1 rounded-full bg-purple-600/20 text-purple-300 text-xs font-bold whitespace-nowrap">
                      {quarter}
                    </span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-600/20 to-transparent" />
                  <div className={`p-2 rounded-lg bg-white/[0.02] ${color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-white/70 text-sm font-medium min-w-fit">{feature}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-purple-600/10">
                <p className="text-white/50 text-xs">Software design diagrams (UML, flowcharts) — Future</p>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-white/60" />
              <h3 className="text-gray-900 dark:text-white font-semibold">This Month</h3>
            </div>

            <div className="space-y-6">
              {/* AI Designs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">AI Designs Generated</span>
                  <span className="text-white text-xs font-semibold">{profile?.designsCount ?? 0} / Unlimited</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 w-full rounded-full" />
                </div>
              </div>

              {/* Analyses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Analyses Run</span>
                  <span className="text-white text-xs font-semibold">{profile?.analysesCount ?? 0} / Unlimited</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-500 w-full rounded-full" />
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Projects</span>
                  <span className="text-white text-xs font-semibold">{profile?.projectsCount ?? 0} active</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-500" style={{ width: `${Math.min(100, ((profile?.projectsCount ?? 0) / 20) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions / Danger Zone */}
          <div className={cn('bg-red-600/10 border rounded-2xl overflow-hidden', dangerExpanded ? 'border-red-600/20' : 'border-red-600/10')}>
            <button
              onClick={() => setDangerExpanded(!dangerExpanded)}
              className="w-full flex items-center justify-between px-8 py-4 hover:bg-red-600/5 transition-colors"
            >
              <h3 className="text-white font-semibold">Account Actions</h3>
              <ChevronDown size={18} className={cn('text-red-400/60 transition-transform', dangerExpanded && 'rotate-180')} />
            </button>

            {dangerExpanded && (
              <div className="border-t border-red-600/10 px-8 py-4 space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 hover:border-red-600/50 rounded-lg text-red-400 font-semibold text-sm transition-all"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 font-medium text-xs transition-colors">
                  <Trash2 size={14} />
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
