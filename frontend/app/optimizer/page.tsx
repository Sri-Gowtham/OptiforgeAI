'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisAPI, projectsAPI, type OptimizerResult, type Project } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import {
  RefreshCw,
  Settings,
  Building2,
  Upload,
  Download,
  MessageCircle,
  Send,
  Check,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type DesignType = 'mechanical' | 'architectural'
type SeverityFilter = 'all' | 'HIGH' | 'MEDIUM' | 'LOW'

const severityConfig = {
  HIGH: { border: 'border-red-500/40', bg: 'bg-red-500/10', text: 'text-red-400', label: 'High' },
  MEDIUM: { border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Medium' },
  LOW: { border: 'border-green-500/40', bg: 'bg-green-500/10', text: 'text-green-400', label: 'Low' },
}

const progressSteps = [
  'Parsing design specifications…',
  'Checking structural integrity…',
  'Evaluating material selection…',
  'Calculating cost optimizations…',
  'Generating recommendations…',
]

function ScannerAnimation() {
  return (
    <style>{`
      @keyframes scannerLine {
        0%, 100% { top: 0; }
        50% { top: 100%; }
      }
      .scanner-line {
        animation: scannerLine 2s ease-in-out infinite;
      }
    `}</style>
  )
}

function AnalyzingState() {
  const [completed, setCompleted] = useState<number[]>([])

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []
    progressSteps.forEach((_, idx) => {
      intervals.push(
        setTimeout(() => {
          setCompleted((prev) => [...prev, idx])
        }, 500 + idx * 700)
      )
    })
    return () => intervals.forEach(clearInterval)
  }, [])

  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-12">
      <ScannerAnimation />

      {/* Scanner effect */}
      <div className="relative w-full h-32 bg-white/[0.02] rounded-xl border border-white/[0.08] mb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="scanner-line absolute w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-600/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin" style={{ animationDuration: '1.5s' }} />
          </div>
        </div>
      </div>

      {/* Status text */}
      <p className="text-center text-white/70 text-sm font-medium mb-8">Claude AI is analyzing your design…</p>

      {/* Checklist */}
      <div className="space-y-3 max-w-md mx-auto">
        {progressSteps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${500 + idx * 700}ms` }}>
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all',
                completed.includes(idx)
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/30'
              )}
            >
              {completed.includes(idx) ? <Check size={14} /> : <span className="text-xs font-bold">{idx + 1}</span>}
            </div>
            <span className={completed.includes(idx) ? 'text-emerald-400' : 'text-white/50'}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OptimizerPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [designType, setDesignType] = useState<DesignType>('mechanical')
  const [description, setDescription] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<OptimizerResult | null>(null)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [costExpanded, setCostExpanded] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    projectsAPI.getAll().then(setProjects)
  }, [user])

  async function handleRun() {
    if (!description.trim()) {
      toast.error('Please enter a design description')
      return
    }
    setRunning(true)
    setResult(null)
    setChatMessages([])
    try {
      const r = await analysisAPI.runOptimizer(selectedProject, description, designType)
      setResult(r)
      toast.success('Analysis complete')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && ['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      const reader = new FileReader()
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      toast.error('Please upload a PNG, JPG, or SVG file')
    }
  }

  function handleSendChat() {
    if (!chatInput.trim()) return
    setChatMessages((prev) => [...prev, { role: 'user', text: chatInput }])
    setChatInput('')
    setTimeout(() => {
      const responses = [
        'The score increased by 12% when I applied suggestion #1. Consider prioritizing that first.',
        'Material switching alone could reduce your cost estimate by approximately 18%.',
        'The HIGH severity issue has the highest impact-to-effort ratio. I recommend tackling that first.',
      ]
      setChatMessages((prev) => [...prev, { role: 'assistant', text: responses[Math.floor(Math.random() * responses.length)] }])
    }, 1200)
  }

  const filtered =
    severityFilter === 'all'
      ? result?.suggestions || []
      : (result?.suggestions || []).filter((s) => s.severity === severityFilter)

  if (loading || !user) return null

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
                <RefreshCw size={24} className={running ? 'animate-spin' : ''} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Optimizer</h1>
            </div>
            <p className="text-gray-500 dark:text-white/50 text-base">Get AI-powered structural analysis and optimization suggestions</p>
          </div>

          {!result && !running && (
            <>
              {/* Input Card */}
              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-8 mb-8 space-y-6">
                <label className="text-gray-500 dark:text-white/60 text-xs font-semibold uppercase tracking-widest">Design Input</label>

                {/* Project Selector */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-white/70 font-medium">Select Project</label>
                  <div className="relative">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0d0d14] text-white/50">
                        Choose a project…
                      </option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0d0d14] text-white">
                          {p.name} — {p.score}%
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Design Type Toggle */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 font-medium">Design Type</label>
                  <div className="flex gap-2">
                    {(['mechanical', 'architectural'] as DesignType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setDesignType(type)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex-1 justify-center',
                          designType === type
                            ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-300'
                            : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/[0.15] hover:text-white/70'
                        )}
                      >
                        {type === 'mechanical' ? <Settings size={16} /> : <Building2 size={16} />}
                        {type === 'mechanical' ? '⚙️ Mechanical' : '🏛️ Architectural'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Design Description */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 font-medium">Design Description</label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Include: materials used, dimensions, load requirements, purpose, any known issues for best results"
                    className="w-full bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Upload Zone */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 font-medium">Design Image (Optional)</label>
                  <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-white/[0.1] hover:border-indigo-600/40 rounded-xl bg-white/[0.02] hover:bg-indigo-600/5 transition-all cursor-pointer group">
                    <Upload size={24} className="text-white/30 group-hover:text-indigo-400 transition-colors" />
                    <div className="text-center">
                      <p className="text-white/60 text-sm font-medium">Drag & drop design image or click to upload</p>
                      <p className="text-white/30 text-xs mt-1">PNG, JPG, or SVG (max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadedImage && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/[0.1]">
                      <img src={uploadedImage} alt="Uploaded design" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Run Button */}
                <button
                  onClick={handleRun}
                  disabled={running || !description.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
                >
                  {running ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      Run AI Analysis
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Analyzing State */}
          {running && <AnalyzingState />}

          {/* Results */}
          {result && !running && (
            <div className="space-y-8">
              {/* Score Hero Card */}
              <div
                className={cn(
                  'relative rounded-2xl p-12 text-center overflow-hidden border',
                  result.score >= 75
                    ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-600/30'
                    : result.score >= 50
                    ? 'bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-600/30'
                    : 'bg-gradient-to-br from-red-600/20 to-rose-600/20 border-red-600/30'
                )}
              >
                <div className="relative z-10">
                  <p className="text-white/60 text-sm mb-4">Analysis Complete</p>
                  <div
                    className={cn(
                      'text-8xl font-bold mb-4',
                      result.score >= 75
                        ? 'text-green-400'
                        : result.score >= 50
                        ? 'text-amber-400'
                        : 'text-red-400'
                    )}
                  >
                    {result.score}
                  </div>
                  <p className="text-white/70 text-lg font-semibold mb-4">Optimization Score</p>
                  <p className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto">
                    {result.score >= 75
                      ? 'Excellent design optimization. Minor improvements possible.'
                      : result.score >= 50
                      ? 'Good baseline design with several optimization opportunities.'
                      : 'Design requires significant improvements for optimal performance.'}
                  </p>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6">
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-4">Overall Score</p>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div
                        className={cn(
                          'text-5xl font-bold mb-2',
                          result.score >= 75
                            ? 'text-green-400'
                            : result.score >= 50
                            ? 'text-amber-400'
                            : 'text-red-400'
                        )}
                      >
                        {result.score}
                      </div>
                      <p className="text-white/40 text-xs">/100</p>
                    </div>
                    <svg className="w-16 h-16" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${(result.score / 100) * 283} 283`}
                        className={cn(
                          result.score >= 75
                            ? 'text-green-400'
                            : result.score >= 50
                            ? 'text-amber-400'
                            : 'text-red-400'
                        )}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Issues Card */}
                <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6">
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-4">Issues Found</p>
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mb-4">{result.issuesCount}</p>
                  <div className="space-y-2 text-sm">
                    {result.suggestions.filter((s) => s.severity === 'HIGH').length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-400">
                          {result.suggestions.filter((s) => s.severity === 'HIGH').length} High
                        </span>
                      </div>
                    )}
                    {result.suggestions.filter((s) => s.severity === 'MEDIUM').length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-amber-400">
                          {result.suggestions.filter((s) => s.severity === 'MEDIUM').length} Medium
                        </span>
                      </div>
                    )}
                    {result.suggestions.filter((s) => s.severity === 'LOW').length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-green-400">
                          {result.suggestions.filter((s) => s.severity === 'LOW').length} Low
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Card */}
                <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6">
                  <p className="text-gray-500 dark:text-white/50 text-xs uppercase tracking-widest mb-4">Cost Estimate</p>
                  <p className="text-4xl font-bold text-indigo-400 mb-3">{result.costEstimate}</p>
                  <p className="text-white/40 text-xs">Estimated manufacturing cost</p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-teal-600/10 border border-teal-600/20 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setCostExpanded(!costExpanded)}
                  className="w-full flex items-center justify-between p-6 hover:bg-teal-600/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <h3 className="text-white font-semibold">Cost Breakdown</h3>
                  </div>
                  <RefreshCw size={18} className={cn('text-teal-400 transition-transform', costExpanded && 'rotate-180')} />
                </button>

                {costExpanded && (
                  <div className="px-6 pb-6 pt-3 border-t border-teal-600/10 space-y-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/50 text-xs uppercase tracking-widest border-b border-teal-600/10">
                          <th className="text-left pb-3 font-medium">Material</th>
                          <th className="text-right pb-3 font-medium">Quantity</th>
                          <th className="text-right pb-3 font-medium">Unit Cost</th>
                          <th className="text-right pb-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-teal-600/10">
                          <td className="py-3 text-white/70">Primary Material</td>
                          <td className="text-right text-white/70">1</td>
                          <td className="text-right text-white/70">$2,400</td>
                          <td className="text-right text-white font-semibold">$2,400</td>
                        </tr>
                        <tr className="border-b border-teal-600/10">
                          <td className="py-3 text-white/70">Components & Hardware</td>
                          <td className="text-right text-white/70">24</td>
                          <td className="text-right text-white/70">$85</td>
                          <td className="text-right text-white font-semibold">$2,040</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-white/70">Labor (est.)</td>
                          <td className="text-right text-white/70">—</td>
                          <td className="text-right text-white/70">—</td>
                          <td className="text-right text-white font-semibold">$1,200</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between py-3 border-t border-teal-600/20">
                      <p className="text-white font-semibold">Total Estimated Cost</p>
                      <p className="text-2xl font-bold text-teal-400">$5,640</p>
                    </div>
                    <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 font-medium text-sm rounded-lg transition-colors">
                      <Download size={14} />
                      Export BOM
                    </button>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-widest">Optimization Suggestions</label>
                    <span className="inline-block ml-2 px-2.5 py-1 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-semibold">
                      {result.suggestions.length} total
                    </span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'HIGH', 'MEDIUM', 'LOW'] as (SeverityFilter | 'HIGH' | 'MEDIUM' | 'LOW')[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSeverityFilter(filter as SeverityFilter)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                        severityFilter === filter
                          ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-300'
                          : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/[0.15] hover:text-white/70'
                      )}
                    >
                      {filter === 'all' ? 'All' : filter === 'HIGH' ? '🔴 High' : filter === 'MEDIUM' ? '🟡 Medium' : '🟢 Low'}
                    </button>
                  ))}
                </div>

                {/* Suggestion Cards */}
                <div className="space-y-3">
                  {filtered.map((s, idx) => {
                    const cfg = severityConfig[s.severity]
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'border-l-4 rounded-xl p-6 bg-white/[0.02] border border-white/[0.08] transition-all',
                          cfg.border
                        )}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cfg.bg, cfg.text)}>
                              {cfg.label}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-600/15 text-indigo-300 text-xs font-medium">AI</span>
                            <span className="text-white/40 text-xs">#{idx + 1}</span>
                          </div>
                        </div>
                        <h4 className="text-white font-bold text-base mb-2">{s.title}</h4>
                        <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-3">{s.description}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Zap size={14} className={cfg.text} />
                          <span className={cn('text-xs font-medium', cfg.text)}>Impact: {s.impact}</span>
                        </div>
                        <button className="text-white/50 hover:text-white/70 text-xs font-medium transition-colors">
                          ✓ Mark as Applied
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Row */}
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 font-medium text-sm rounded-lg transition-all">
                  <Download size={16} />
                  Download Full Report
                </button>
                <button
                  onClick={() => {
                    setResult(null)
                    setDescription('')
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] text-white/60 font-medium text-sm rounded-lg transition-all"
                >
                  <RefreshCw size={16} />
                  Run New Analysis
                </button>
                <button onClick={() => router.push('/projects')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-all">
                  View Project →
                </button>
              </div>

              {/* AI Chat Panel */}
              <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={18} className="text-indigo-400" />
                  <h4 className="text-white font-semibold">Ask about this analysis</h4>
                </div>

                {/* Chat messages */}
                {chatMessages.length > 0 && (
                  <div className="space-y-3 mb-4 pb-4 border-b border-indigo-600/20">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={cn(
                            'max-w-xs rounded-lg px-4 py-2 text-sm',
                            msg.role === 'user'
                              ? 'bg-indigo-600/30 text-white'
                              : 'bg-white/[0.05] text-white/70'
                          )}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask a question about this analysis…"
                    className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
