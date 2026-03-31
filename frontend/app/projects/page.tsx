'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { projectsAPI, type Project } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import { Plus, Search, Trash2, FolderOpen, X, Calendar, Grid3x3, List, Cog, Building2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type FilterType = 'all' | 'mechanical' | 'architectural' | 'analyzed' | 'not-analyzed'
type SortType = 'newest' | 'oldest' | 'highest-score'
type ViewType = 'grid' | 'list'

const designTypes = [
  { id: 'mechanical', label: 'Mechanical', icon: Cog },
  { id: 'architectural', label: 'Architectural', icon: Building2 },
]

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'bg-green-500/15 text-green-400 border-green-500/20'
      : score >= 50
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      : score >= 0
      ? 'bg-red-500/15 text-red-400 border-red-500/20'
      : 'bg-white/5 text-white/50 border-white/10'
  const label =
    score >= 75 ? `${score}% ✓` : score >= 50 ? `${score}%` : score >= 0 ? `${score}%` : 'Not analyzed'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded bg-white/[0.06]" />
        <div className="w-16 h-5 rounded-full bg-white/[0.06]" />
      </div>
      <div className="h-4 bg-white/[0.06] rounded w-2/3" />
      <div className="h-3 bg-white/[0.06] rounded w-full" />
      <div className="h-3 bg-white/[0.06] rounded w-3/4" />
      <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center">
        <div className="h-3 bg-white/[0.06] rounded w-1/4" />
        <div className="h-5 bg-white/[0.06] rounded w-16" />
      </div>
    </div>
  )
}

function FolderSVG() {
  return (
    <svg className="w-24 h-24 mx-auto mb-6 text-indigo-600/30" viewBox="0 0 100 100" fill="none">
      <path
        d="M15 25L15 80C15 85.5228 19.4772 90 25 90L75 90C80.5228 90 85 85.5228 85 80V35C85 29.4772 80.5228 25 75 25L40 25L30 15C28.3431 13.3431 26.2279 12.5 24 12.5C18.4772 12.5 15 16.4772 15 25Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <circle cx="35" cy="55" r="6" fill="currentColor" opacity="0.5" />
      <circle cx="55" cy="60" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('newest')
  const [view, setView] = useState<ViewType>('grid')
  const [showModal, setShowModal] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedType, setSelectedType] = useState<'mechanical' | 'architectural'>('mechanical')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    projectsAPI.getAll().then(setProjects).finally(() => setFetchLoading(false))
  }, [user])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Project name is required')
      return
    }
    setCreating(true)
    try {
      const p = await projectsAPI.create(name.trim(), description.trim())
      setProjects((prev) => [p, ...prev])
      setShowModal(false)
      setName('')
      setDescription('')
      setSelectedType('mechanical')
      toast.success('Project created')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await projectsAPI.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  // Filter projects
  let filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'mechanical') return p.type === 'mechanical'
    if (filter === 'architectural') return p.type === 'architectural'
    if (filter === 'analyzed') return p.score >= 0
    if (filter === 'not-analyzed') return p.score < 0
    return true
  })

  // Sort projects
  if (sort === 'newest') filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  if (sort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  if (sort === 'highest-score') filtered.sort((a, b) => (b.score || -1) - (a.score || -1))

  if (loading || !user) return null

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Mechanical', value: 'mechanical' },
    { label: 'Architectural', value: 'architectural' },
    { label: 'Analyzed', value: 'analyzed' },
    { label: 'Not Analyzed', value: 'not-analyzed' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white">Projects</h1>
              <span className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-semibold border border-indigo-600/30">
                {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-lg transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
            >
              <Plus size={16} /> New Project
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {filterOptions.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === value
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-600/50'
                      : 'bg-white/[0.03] text-white/60 border border-white/[0.08] hover:border-white/[0.15] hover:text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/70 hover:text-white/90 text-xs font-medium transition-all"
                >
                  {sort === 'newest' && 'Newest'}
                  {sort === 'oldest' && 'Oldest'}
                  {sort === 'highest-score' && 'Highest Score'}
                  <ChevronDown size={14} className={showSortMenu ? 'rotate-180' : ''} />
                </button>

                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white/[0.08] backdrop-blur border border-white/[0.1] rounded-lg overflow-hidden shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { label: 'Newest', value: 'newest' as SortType },
                      { label: 'Oldest', value: 'oldest' as SortType },
                      { label: 'Highest Score', value: 'highest-score' as SortType },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setSort(value)
                          setShowSortMenu(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                          sort === value
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-lg p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded transition-all ${
                    view === 'grid'
                      ? 'bg-indigo-600/30 text-indigo-400'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 size={14} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded transition-all ${
                    view === 'list'
                      ? 'bg-indigo-600/30 text-indigo-400'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                  aria-label="List view"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid/List */}
          {fetchLoading ? (
            <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FolderSVG />
              <h2 className="text-2xl font-bold text-white mb-2">No projects yet</h2>
              <p className="text-white/50 text-sm mb-6">
                {search ? 'No projects match your search.' : 'Create your first design to get started.'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-all"
                >
                  <Plus size={16} /> Create your first project
                </button>
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="group relative bg-white/[0.03] backdrop-blur border border-white/[0.08] hover:border-indigo-600/40 rounded-xl p-5 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-1"
                >
                  {/* Type Badge */}
                  <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-semibold">
                    {p.type === 'mechanical' ? '⚙️ Mechanical' : '🏛️ Architectural'}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(p.id)
                    }}
                    disabled={deletingId === p.id}
                    className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    aria-label="Delete project"
                  >
                    {deletingId === p.id ? (
                      <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <X size={14} />
                    )}
                  </button>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs mb-3">
                    {p.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <h3 className="text-white font-semibold text-sm mb-1 truncate">{p.name}</h3>
                  <p className="text-white/50 text-xs mb-4 line-clamp-2">{p.description || 'No description'}</p>

                  {/* Divider */}
                  <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      <Calendar size={12} />
                      {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <ScoreBadge score={p.score} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="group relative bg-white/[0.03] backdrop-blur border border-white/[0.08] hover:border-indigo-600/40 rounded-xl p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-600/20"
                >
                  <div className="flex items-center gap-4 justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold text-sm truncate">{p.name}</h3>
                        <p className="text-white/50 text-xs truncate">{p.description || 'No description'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-white/40 mb-1">
                          {p.type === 'mechanical' ? '⚙️ Mechanical' : '🏛️ Architectural'}
                        </div>
                        <div className="text-xs text-white/40">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <ScoreBadge score={p.score} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(p.id)
                        }}
                        disabled={deletingId === p.id}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        aria-label="Delete project"
                      >
                        {deletingId === p.id ? (
                          <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-[#13131f] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Gradient accent bar */}
            <div className="h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">New Project</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 font-medium">Project name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gear Assembly v2"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 font-medium">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the project…"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all resize-none"
                  />
                </div>

                {/* Design Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 font-medium">Design type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {designTypes.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedType(id as 'mechanical' | 'architectural')}
                        className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                          selectedType === id
                            ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-300'
                            : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/[0.15] hover:text-white/80'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 text-sm font-medium rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !name.trim()}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    {creating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Create Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
