'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { dashboardAPI, projectsAPI, type DashboardStats, type Project } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import { Sparkles, RefreshCw, FolderOpen, FlaskConical, TrendingUp, Sparkles as SparklesIcon, PenTool, Box, Users, Lock, Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const aiTips = [
  "Use the AI Optimizer on existing projects to get targeted improvement suggestions with severity ratings — it takes under 30 seconds.",
  "Describe your design constraints (materials, dimensions, load limits) for more accurate AI-generated specs.",
  "The Manual Editor supports real-time collaboration — invite teammates to iterate on designs together.",
  "Export your optimized designs as technical specifications compatible with CAD software.",
  "Run multiple optimization passes on the same design to explore different solution spaces.",
]

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'bg-green-500/15 text-green-400 border-green-500/20'
      : score >= 50
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      : 'bg-red-500/15 text-red-400 border-red-500/20'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {score}%
    </span>
  )
}

function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse`} />
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
  glowColor,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  loading: boolean
  glowColor: string
}) {
  return (
    <div className={`bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 transition-all ${glowColor}`}>
      {loading ? (
        <div className="space-y-3">
          <SkeletonLine w="w-1/2" h="h-3" />
          <SkeletonLine w="w-1/3" h="h-7" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 dark:text-white/40 text-xs font-medium mb-2">{label}</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={`p-3 rounded-lg bg-gray-100 dark:bg-white/[0.04] ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter()
  const initial = project.name[0]?.toUpperCase() ?? 'P'
  return (
    <div 
      onClick={() => {
        const path = project.sourceType === 'ai' ? `/designs/${project.id}` : `/editor?id=${project.id}`;
        console.log('[ROUTING] Dashboard click:', path, 'Source Type:', project.sourceType);
        router.push(path);
      }}
      className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-600/20"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 dark:text-white font-semibold text-sm truncate">{project.name}</h3>
          <p className="text-gray-500 dark:text-white/40 text-xs mt-1 truncate">{project.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-white/40">
          {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <ScoreBadge score={project.score} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [refreshingTip, setRefreshingTip] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([dashboardAPI.getStats(), projectsAPI.getAll()])
      .then(([s, p]) => {
        setStats(s)
        setProjects(p.slice(0, 4))
      })
      .catch(() => {
        toast.error('Failed to load dashboard data')
      })
      .finally(() => setFetchLoading(false))
  }, [user])

  if (loading || !user) return null

  const firstName = user.email.split('@')[0]

  function handleRefreshTip() {
    setRefreshingTip(true)
    setTimeout(() => {
      setCurrentTipIndex((i) => (i + 1) % aiTips.length)
      setRefreshingTip(false)
    }, 300)
  }

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {greeting}, <span className="text-indigo-400">{firstName}</span> 👋
              </h1>
              <p className="text-gray-500 dark:text-white/40 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Link
              href="/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-lg transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
            >
              <span>+</span> New Design
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              label="Total Projects"
              value={stats?.totalProjects ?? 0}
              icon={FolderOpen}
              color="text-indigo-400"
              loading={fetchLoading}
              glowColor="border-indigo-600/30 hover:border-indigo-600/50 hover:shadow-lg hover:shadow-indigo-600/20"
            />
            <StatCard
              label="Analyses Run"
              value={stats?.analysesRun ?? 0}
              icon={FlaskConical}
              color="text-purple-400"
              loading={fetchLoading}
              glowColor="border-purple-600/30 hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-600/20"
            />
            <StatCard
              label="Avg Score"
              value={stats?.avgScore ? `${stats.avgScore}%` : '—'}
              icon={TrendingUp}
              color={
                stats?.avgScore && stats.avgScore >= 75
                  ? 'text-emerald-400'
                  : stats?.avgScore && stats.avgScore >= 50
                  ? 'text-amber-400'
                  : 'text-red-400'
              }
              loading={fetchLoading}
              glowColor="border-cyan-600/30 hover:border-cyan-600/50 hover:shadow-lg hover:shadow-cyan-600/20"
            />
          </div>

          {/* AI Tip Card */}
          <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600/20 shrink-0">
                <SparklesIcon size={20} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold">
                    ✨ AI Design Tip of the Day
                  </span>
                </div>
                <p className="text-gray-600 dark:text-white/70 text-sm leading-relaxed">{aiTips[currentTipIndex]}</p>
              </div>
              <button
                onClick={handleRefreshTip}
                disabled={refreshingTip}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={18} className={refreshingTip ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* AI Design Creation */}
            <Link
              href="/create"
              className="group bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-600/20 hover:border-indigo-600/40 rounded-xl p-8 transition-all hover:shadow-lg hover:shadow-indigo-600/20"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Sparkles size={28} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Design Creation</h3>
              <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed mb-4">
                Describe your idea, Claude AI generates complete specs instantly
              </p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/60">Mechanical</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/60">Architectural</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm group-hover:gap-3 transition-all">
                Start Creating <ArrowRight size={16} />
              </div>
            </Link>

            {/* AI Optimizer */}
            <Link
              href="/optimizer"
              className="group bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-600/20 hover:border-purple-600/40 rounded-xl p-8 transition-all hover:shadow-lg hover:shadow-purple-600/20"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-lg bg-purple-600/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <RefreshCw size={28} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Optimizer</h3>
              <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed mb-4">
                Get structural analysis, material suggestions and cost optimization
              </p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/60">Analysis</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/60">Suggestions</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/60">Cost</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm group-hover:gap-3 transition-all">
                Optimize Now <ArrowRight size={16} />
              </div>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="mb-10">
            <h2 className="text-gray-500 dark:text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
              Coming Soon Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Manual Editor */}
              <Link
                href="/editor"
                className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] hover:border-teal-600/40 rounded-xl p-6 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-teal-600/20 text-teal-400 group-hover:scale-110 transition-transform">
                    <PenTool size={20} />
                  </div>
                  <Check size={18} className="text-emerald-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Manual Editor</h3>
                <p className="text-gray-500 dark:text-white/40 text-xs mb-4">AutoCAD-replica canvas</p>
                <div className="text-teal-400 font-semibold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                  Try Beta <ArrowRight size={12} />
                </div>
              </Link>

              {/* 3D Preview */}
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 opacity-60 cursor-not-allowed">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-purple-600/20 text-purple-400">
                    <Box size={20} />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <Lock size={12} className="text-amber-400" />
                    <span className="text-amber-400 text-xs font-semibold">Coming Soon</span>
                  </div>
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">3D Preview</h3>
                <p className="text-gray-500 dark:text-white/40 text-xs">2D to 3D render</p>
              </div>

              {/* Collaboration */}
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 opacity-60 cursor-not-allowed">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400">
                    <Users size={20} />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <Lock size={12} className="text-amber-400" />
                    <span className="text-amber-400 text-xs font-semibold">Coming Soon</span>
                  </div>
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Collaboration</h3>
                <p className="text-gray-500 dark:text-white/40 text-xs">Team design sharing</p>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-500 dark:text-white/60 text-xs font-semibold uppercase tracking-widest">
                Recent Projects
              </h2>
              <Link href="/projects" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {fetchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5 space-y-3">
                    <SkeletonLine w="w-1/2" h="h-4" />
                    <SkeletonLine w="w-full" h="h-3" />
                    <SkeletonLine w="w-1/3" h="h-3" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-12 text-center">
                <FolderOpen size={40} className="text-gray-300 dark:text-white/20 mx-auto mb-4" />
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-500 dark:text-white/40 text-sm mb-6">Create your first design to get started</p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  <Sparkles size={16} /> Create Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
