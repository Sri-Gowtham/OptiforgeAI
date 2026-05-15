'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisAPI, projectsAPI, designAPI, type DesignResult, type Project } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import {
  Sparkles,
  AlertTriangle,
  Save,
  RefreshCw,
  Settings,
  Building2,
  ChevronRight,
  MessageCircle,
  Send,
  Download,
  Edit3,
  Check,
  X,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

type DesignType = 'mechanical' | 'architectural'

const templates = [
  { icon: '⚙️', text: 'Steel wall bracket 80kg load' },
  { icon: '🏛️', text: '3-bedroom apartment 1200sqft' },
  { icon: '⚙️', text: 'Bicycle gear assembly 7-speed' },
  { icon: '🏛️', text: 'Concrete column footing 3-story' },
  { icon: '⚙️', text: 'Aluminum enclosure for electronics' },
  { icon: '🏛️', text: 'Staircase design 3m height' },
]

const examplePrompts: Record<DesignType, string[]> = {
  mechanical: [
    'Compact gear reduction unit with oil lubrication',
    'High-precision spindle bearing assembly',
    'Lightweight servo motor mounting bracket',
  ],
  architectural: [
    'Modern 4-storey mixed-use building',
    'Energy-efficient single-family home',
    'Modular university lab block',
  ],
}

const progressSteps = [
  'Analyzing your requirements…',
  'Calculating specifications…',
  'Generating component list…',
  'Creating design blueprint…',
]

function ProgressAnimation() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []
    progressSteps.forEach((_, idx) => {
      intervals.push(
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, idx])
        }, 600 + idx * 800)
      )
    })
    return () => intervals.forEach(clearInterval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-12 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-600/30 animate-pulse" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin"
            style={{ animationDuration: '2s' }}
          />
          <Sparkles className="absolute inset-0 m-auto text-indigo-400" size={28} />
        </div>
      </div>

      <div className="space-y-4 text-center max-w-sm">
        {progressSteps.map((step, idx) => (
          <div key={idx} className="flex items-center justify-center gap-3 text-sm">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all ${
                completedSteps.includes(idx)
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : idx < Math.max(...completedSteps, -1) + 1
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-indigo-600/20 text-indigo-300'
              }`}
            >
              {completedSteps.includes(idx) ? <Check size={14} /> : <span className="text-xs font-bold">{idx + 1}</span>}
            </div>
            <span className={completedSteps.includes(idx) ? 'text-emerald-400' : 'text-white/60'}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [designType, setDesignType] = useState<DesignType>('mechanical')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [existingProjects, setExistingProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (showSaveModal && user) {
      projectsAPI.getAll().then(setExistingProjects)
    }
  }, [showSaveModal, user])

  async function handleGenerate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setResult(null)
    try {
      const data = await analysisAPI.generateDesign(prompt, designType)
      console.log('RAW DATA FROM API:', data)
      console.log('FULL API RESPONSE:', data)
      console.log('IMAGE URL:', data?.imageUrl)
      console.log('RESULT STATE SET:', JSON.stringify(data).slice(0, 200))
      setResult(data)
      toast.success('Design generated successfully')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveProject() {
    if (!result) return
    setSaving(true)
    try {
      if (selectedProjectId) {
        // Save to existing project (in a real app)
        toast.success('Saved to project')
      } else if (projectName.trim()) {
        console.log('[AI SAVE] Saving AI design as project:', projectName);
        const cad = result.cadGeometry || { elements: [], constraints: [] };
        await designAPI.save(
          projectName.trim(), 
          cad.elements || [], 
          cad.constraints || [], 
          undefined, 
          'ai'
        );
        toast.success('AI design saved to collection');
      } else {
        toast.error('Enter a project name')
        setSaving(false)
        return
      }
      setShowSaveModal(false)
      setProjectName('')
      setSelectedProjectId(null)
    } catch {
      toast.error('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  function handleSendChat() {
    if (!chatInput.trim()) return
    setChatMessages((prev) => [...prev, { role: 'user', text: chatInput }])
    setChatInput('')
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'This design could be improved by optimizing the corner radii to reduce stress concentration by up to 30%.',
        'Consider using a composite material instead of aluminum to reduce weight by 25% at comparable cost.',
      ]
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: responses[Math.floor(Math.random() * responses.length)] },
      ])
    }, 1200)
  }

  if (loading || !user) return null

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          {!result && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-white/50 text-sm mb-8">
              <button onClick={() => router.push('/dashboard')} className="hover:text-gray-700 dark:hover:text-white/70 transition-colors">
                Dashboard
              </button>
              <ChevronRight size={14} className="text-gray-300 dark:text-white/30" />
              <span className="text-gray-900 dark:text-white">AI Create</span>
            </div>
          )}

          {/* Header */}
          {!result && !generating && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Sparkles size={24} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Design Creation</h1>
              </div>
              <p className="text-gray-500 dark:text-white/50 text-base">Describe your design — Claude AI generates complete specifications</p>
            </div>
          )}

          {generating && <ProgressAnimation />}

          {/* Templates row */}
          {!result && !generating && (
            <div className="mb-10">
              <label className="text-gray-500 dark:text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 block">
                Quick start templates:
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {templates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(t.text)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] hover:border-indigo-600/40 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white/90 text-sm whitespace-nowrap transition-all shrink-0"
                  >
                    <span>{t.icon}</span>
                    {t.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Design Type */}
          {!result && !generating && (
            <div className="mb-10">
              <label className="text-gray-500 dark:text-white/60 text-xs font-semibold uppercase tracking-widest mb-4 block">
                Step 1 — Design type
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['mechanical', 'architectural'] as DesignType[]).map((type) => {
                  const active = designType === type
                  const isMech = type === 'mechanical'
                  const Icon = isMech ? Settings : Building2
                  return (
                    <button
                      key={type}
                      onClick={() => setDesignType(type)}
                      className={`relative flex flex-col gap-4 p-8 rounded-2xl border-2 transition-all ${
                        active
                          ? isMech
                            ? 'border-indigo-600/60 bg-indigo-600/10 shadow-lg shadow-indigo-600/20'
                            : 'border-purple-600/60 bg-purple-600/10 shadow-lg shadow-purple-600/20'
                          : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      {active && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check size={16} />
                        </div>
                      )}
                      <div className={`inline-flex w-16 h-16 rounded-xl items-center justify-center ${
                        active
                          ? isMech
                            ? 'bg-indigo-600/30 text-indigo-400 shadow-lg shadow-indigo-600/30'
                            : 'bg-purple-600/30 text-purple-400 shadow-lg shadow-purple-600/30'
                          : 'bg-white/[0.05] text-white/40'
                      }`}>
                        <Icon size={32} />
                      </div>
                      <div className="text-left">
                        <h3 className={`text-lg font-bold mb-2 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/70'}`}>
                          {isMech ? 'Mechanical Design' : 'Architectural Design'}
                        </h3>
                        <p className={`text-sm mb-3 ${active ? 'text-gray-600 dark:text-white/70' : 'text-gray-500 dark:text-white/50'}`}>
                          {isMech
                            ? 'Gears, brackets, frames, machine parts, assemblies'
                            : 'Floor plans, structural elements, buildings'}
                        </p>
                        <p className={`text-xs ${active ? 'text-indigo-300' : 'text-white/40'}`}>
                          Examples: {isMech ? 'brackets · gears · enclosures · joints' : 'floor plans · columns · beams · staircases'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Prompt Input */}
          {!result && !generating && (
            <div className="mb-8">
              <label className="text-gray-500 dark:text-white/60 text-xs font-semibold uppercase tracking-widest mb-4 block">
                Step 2 — Describe your design
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                    placeholder="Describe your design in detail. Include materials, dimensions, loads, constraints, and any special requirements…"
                    className="w-full bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 dark:focus:bg-white/[0.05] transition-all resize-none leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-4 text-xs text-gray-400 dark:text-white/30">
                    {prompt.length}/1000
                  </div>
                </div>

                {/* Example prompt pills */}
                <div className="flex flex-wrap gap-2">
                  {examplePrompts[designType].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrompt(p)}
                      className="text-xs bg-white/[0.03] hover:bg-indigo-600/15 border border-white/[0.08] hover:border-indigo-600/30 text-white/50 hover:text-indigo-300 px-3 py-1.5 rounded-lg transition-all"
                    >
                      ✦ {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Claude AI is generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Design
                  </>
                )}
              </button>
            </div>
          )}

          {/* Result Section */}
          {result && !generating && (
            <div className="space-y-6">
              {/* Overview Card */}
              <div className="relative bg-gray-50 dark:bg-white/[0.02] border-2 border-gray-200 dark:border-white/[0.08] rounded-2xl p-8 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
                <div className="flex items-start justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{result.name}</h2>
                    <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-semibold mb-4">
                      {designType === 'mechanical' ? '⚙️ Mechanical' : '🏛️ Architectural'}
                    </span>
                    <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed max-w-2xl">{result.designNotes}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-500 dark:text-white/40 text-xs mb-1 uppercase tracking-wider">Cost estimate</p>
                    <p className="text-3xl font-bold text-indigo-400">{result.cost}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-all"
                  >
                    <Save size={16} /> Save to Project
                  </button>
                  <button
                    onClick={() => {
                      if (!result?.cadGeometry) return
                      localStorage.setItem('optiforge_ai_cad_transfer', JSON.stringify(result.cadGeometry))
                      router.push('/editor')
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 border border-indigo-600/30 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-sm rounded-lg transition-all"
                  >
                    <Edit3 size={16} /> Open in CAD Editor
                  </button>
                  <button
                    onClick={() => { setResult(null); setPrompt('') }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 font-medium text-sm rounded-lg transition-all"
                  >
                    <RefreshCw size={16} /> Generate New
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 font-medium text-sm rounded-lg transition-all"
                    onClick={() => {
                      if (!result?.svgBlueprint) return
                      const blob = new Blob([result.svgBlueprint], { type: 'image/svg+xml' })
                      const url  = URL.createObjectURL(blob)
                      const a    = document.createElement('a')
                      a.href = url; a.download = 'design.svg'; a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download size={16} /> Download SVG
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 font-medium text-sm rounded-lg transition-all"
                    onClick={async () => {
                      try {
                        const res = await fetch('http://localhost:5000/api/export/dxf', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(result),
                        })
                        if (!res.ok) throw new Error('DXF export failed')
                        const blob = await res.blob()
                        const url  = window.URL.createObjectURL(blob)
                        const a    = document.createElement('a')
                        a.href = url; a.download = 'design.dxf'; a.click()
                        window.URL.revokeObjectURL(url)
                      } catch (err: unknown) {
                        alert(err instanceof Error ? err.message : 'Export failed')
                      }
                    }}
                  >
                    <Download size={16} /> Export DXF
                  </button>
                </div>
              </div>

              {/* Engineering Blueprint */}
              {result && (
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-widest">Engineering Blueprint (Scaled Drawing)</label>
                    <span className="px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-semibold">SVG · Scale {result.scale || '1:1'}</span>
                  </div>

                  {result.svgBlueprint ? (
                    <div
                      className="w-full bg-white rounded-xl overflow-hidden shadow-inner"
                      dangerouslySetInnerHTML={{ __html: result.svgBlueprint }}
                    />
                  ) : result.imageUrl ? (
                    <img
                      src={result.imageUrl}
                      alt="design preview"
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[600px] object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-white/30 text-sm py-16 text-center">No design generated</div>
                  )}
                </div>
              )}

              {/* Two-column: Specifications & Components */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Specifications */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-6 block">
                    Specifications
                  </label>
                  <div className="space-y-3">
                    {result.specifications.map((s: { label: string; value: string }, i: number) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                          i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.04]'
                        }`}
                      >
                        <span className="text-white/50 text-sm">{s.label}</span>
                        <span className="text-white font-semibold text-sm">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Components */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-widest block">
                      Components & Parts
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">BOM v1.0</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-white/40">
                          <th className="pb-3 pr-4 font-medium">NAME</th>
                          <th className="pb-3 pr-4 font-medium">QTY</th>
                          <th className="pb-3 pr-4 font-medium">MATERIAL</th>
                          <th className="pb-3 font-medium">ROLE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {result.components.length > 0 ? (
                          result.components.map((c: any, i: number) => (
                            <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 pr-4 font-medium text-white/80">{c.name}</td>
                              <td className="py-3 pr-4 text-white/60">{c.quantity}</td>
                              <td className="py-3 pr-4 text-indigo-300/70">{c.material}</td>
                              <td className="py-3 text-white/40 italic">{c.role}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-white/20 italic">No component data generated.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Manufacturing Steps */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-8 block">
                  Manufacturing & Assembly Workflow
                </label>
                <div className="relative pl-8 space-y-8">
                  <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-white/[0.06]" />
                  {result.manufacturingSteps.length > 0 ? (
                    result.manufacturingSteps.map((step: string, i: number) => (
                      <div key={i} className="relative group">
                        <div className="absolute -left-8 top-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#0a0a0f] border border-indigo-500/30 text-indigo-400 text-[10px] font-bold z-10 group-hover:border-indigo-500 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all">
                          {i + 1}
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 group-hover:border-white/[0.1] transition-all">
                          <p className="text-white/70 text-sm leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/30 text-sm italic py-4">No manufacturing sequence provided.</div>
                  )}
                </div>
              </div>

              {/* Safety & Considerations */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-widest block">
                    Engineering Safety Standards
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.safetyConsiderations?.length > 0 ? (
                    result.safetyConsiderations.map((note: string, i: number) => (
                      <div key={i} className="bg-amber-500/[0.03] border border-amber-500/10 rounded-xl p-4 flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 mt-1.5 shrink-0" />
                        <p className="text-amber-200/60 text-xs leading-relaxed">{note}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 bg-amber-500/[0.02] border border-amber-500/10 rounded-xl p-6 text-center text-amber-200/30 text-sm italic">
                      No specific safety considerations flagged for this design.
                    </div>
                  )}
                </div>
              </div>

              {/* Design Notes */}
              <div className="bg-indigo-600/[0.03] border border-indigo-600/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all" />
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <div className="p-1.5 rounded-md bg-indigo-600/20 text-indigo-400">
                    <FileText size={14} />
                  </div>
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                    AI Engineering Logic
                  </label>
                </div>
                <div className="relative z-10">
                  <p className="text-white/50 text-sm leading-relaxed font-mono selection:bg-indigo-500/30">
                    {result.designNotes || "No design notes provided."}
                  </p>
                </div>
              </div>

              {/* AI Chat Addon */}
              <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={18} className="text-indigo-400" />
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-widest">Ask AI About This Design</label>
                </div>

                {/* Chat messages */}
                {chatMessages.length > 0 && (
                  <div className="space-y-3 mb-4 pb-4 border-b border-indigo-600/20">
                    {chatMessages.map((msg, i: number) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                            msg.role === 'user'
                              ? 'bg-indigo-600/30 text-white'
                              : 'bg-white/[0.05] text-white/70'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Example prompts if no chat */}
                {chatMessages.length === 0 && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-indigo-600/20">
                    <p className="text-white/50 text-xs mb-2">Example questions:</p>
                    <button className="block w-full text-left px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] text-white/60 hover:text-white/80 rounded-lg text-xs transition-all">
                      "How can I reduce the cost of this design?"
                    </button>
                    <button className="block w-full text-left px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] text-white/60 hover:text-white/80 rounded-lg text-xs transition-all">
                      "What material alternatives would work?"
                    </button>
                  </div>
                )}

                {/* Chat input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask a question about this design…"
                    className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
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

      {/* Save to Project Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setShowSaveModal(false)}
        >
          <div className="bg-[#13131f] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Save to Project</h2>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Existing projects dropdown */}
                {existingProjects.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 font-medium">Or select existing project</label>
                    <select
                      value={selectedProjectId || ''}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value || null)
                        setProjectName('')
                      }}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="">Choose a project…</option>
                      {existingProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* New project name */}
                {!selectedProjectId && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 font-medium">Create new project</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Project name…"
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 text-sm font-medium rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProject}
                    disabled={saving || (!selectedProjectId && !projectName.trim())}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
