'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import {
  MousePointer,
  Hand,
  Minus,
  Square,
  Circle,
  Pen,
  Type,
  RotateCw,
  RotateCcw,
  Maximize2,
  Trash2,
  Hash,
  Magnet,
  Upload,
  Download,
  Sparkles,
  Eye,
  Lock,
  GripVertical,
  MessageSquare,
  ArrowRight,
  X,
  Plus,
} from 'lucide-react'
// lucide-react@0.564.0

type Tool = 'select' | 'pan' | 'line' | 'rect' | 'circle' | 'pen' | 'text'
type RightTab = 'properties' | 'layers' | 'history'

const toolButtons: { id: Tool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
  { id: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'O' },
  { id: 'pen', icon: Pen, label: 'Freehand', shortcut: 'F' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
]

const layers = [
  { name: 'Layer 1', color: '#6366f1', visible: true, locked: false, active: true },
  { name: 'Dimensions', color: '#2dd4bf', visible: true, locked: false, active: false },
  { name: 'Annotations', color: '#6b7280', visible: true, locked: true, active: false },
]

const historyItems = [
  { label: 'Drew Rectangle', time: 'just now', active: true },
  { label: 'Added Circle', time: '1m ago', active: false },
  { label: 'Drew Line', time: '2m ago', active: false },
  { label: 'Opened canvas', time: '5m ago', active: false },
]

const strokeStyles = ['solid', 'dashed', 'dotted'] as const
const materials = ['Steel', 'Aluminum', 'Concrete', 'Wood', 'Plastic', 'None']

function ToolBtn({
  icon: Icon,
  label,
  shortcut,
  active,
  onClick,
  size = 'sm',
}: {
  icon: React.ElementType
  label?: string
  shortcut?: string
  active?: boolean
  onClick?: () => void
  size?: 'sm' | 'xs'
}) {
  return (
    <button
      onClick={onClick}
      title={label && shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        'flex items-center justify-center rounded-md transition-colors',
        size === 'sm' ? 'w-8 h-8' : 'w-7 h-7',
        active
          ? 'bg-indigo-600 text-white'
          : 'text-gray-400 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon size={size === 'sm' ? 15 : 13} />
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-white/[0.08]" />
}

export default function EditorPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [gridOn, setGridOn] = useState(true)
  const [snapOn, setSnapOn] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [rightTab, setRightTab] = useState<RightTab>('properties')
  const [projectName, setProjectName] = useState('Untitled Design')
  const [editingName, setEditingName] = useState(false)
  const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid')
  const [material, setMaterial] = useState('Steel')
  const [showExport, setShowExport] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hi! Ask me anything about your design.' },
    { role: 'user', text: 'What material for outdoor use?' },
    { role: 'assistant', text: 'For outdoor use, I recommend 316 stainless steel or anodized aluminum — both offer excellent corrosion resistance.' },
  ])
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (editingName) nameRef.current?.focus()
  }, [editingName])

  function sendChat() {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }])
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Great question! Based on your design specs, I suggest reviewing the load-bearing joints first for optimal performance.' },
      ])
    }, 1000)
  }

  if (loading || !user) return null

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-12 bg-[#0d0d14] border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
          {/* Left: project name + saved badge */}
          <div className="flex items-center gap-2 mr-3">
            {editingName ? (
              <input
                ref={nameRef}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                className="bg-white/[0.07] border border-indigo-500/50 rounded px-2 py-0.5 text-white text-sm font-medium focus:outline-none w-36"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-white text-sm font-medium hover:text-indigo-300 transition-colors"
              >
                {projectName}
              </button>
            )}
            <span className="text-xs text-emerald-400 font-medium">Saved</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-1">
            {/* Group 1: Select / Pan */}
            <ToolBtn icon={MousePointer} label="Select" shortcut="V" active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
            <ToolBtn icon={Hand} label="Pan" shortcut="H" active={activeTool === 'pan'} onClick={() => setActiveTool('pan')} />
            <Divider />

            {/* Group 2: Draw */}
            <ToolBtn icon={Minus} label="Line" shortcut="L" active={activeTool === 'line'} onClick={() => setActiveTool('line')} />
            <ToolBtn icon={Square} label="Rectangle" shortcut="R" active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} />
            <ToolBtn icon={Circle} label="Circle" shortcut="O" active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} />
            <ToolBtn icon={Pen} label="Freehand" shortcut="F" active={activeTool === 'pen'} onClick={() => setActiveTool('pen')} />
            <ToolBtn icon={Type} label="Text" shortcut="T" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
            <Divider />

            {/* Group 3: Modify */}
            <ToolBtn icon={RotateCw} label="Rotate" active={false} />
            <ToolBtn icon={Maximize2} label="Scale" active={false} />
            <ToolBtn icon={Trash2} label="Delete" active={false} />
            <Divider />

            {/* Group 4: View */}
            <ToolBtn icon={Hash} label="Toggle Grid" active={gridOn} onClick={() => setGridOn(!gridOn)} />
            <ToolBtn icon={Magnet} label="Toggle Snap" active={snapOn} onClick={() => setSnapOn(!snapOn)} />
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors text-base leading-none"
              >
                −
              </button>
              <span className="text-xs text-gray-400 w-10 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(400, z + 25))}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors text-base leading-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Right: undo/redo, import, export, analyze */}
          <div className="flex items-center gap-1 ml-3">
            <ToolBtn icon={RotateCcw} label="Undo" />
            <ToolBtn icon={RotateCw} label="Redo" />
            <Divider />
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium">
              <Upload size={13} /> Import
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
              >
                <Download size={13} /> Export
              </button>
              {showExport && (
                <div className="absolute top-full right-0 mt-1 bg-[#1a1a2e] border border-white/[0.1] rounded-lg overflow-hidden shadow-xl z-30 min-w-28">
                  {['PNG', 'PDF', 'SVG'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setShowExport(false)}
                      className="block w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => router.push('/optimizer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold hover:from-indigo-500 hover:to-indigo-400 transition-all"
            >
              <Sparkles size={13} /> Analyze with AI
            </button>
          </div>
        </div>

        {/* Middle: left mini toolbar + canvas + right panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Mini Toolbar */}
          <div className="w-12 bg-[#0d0d14] border-r border-white/[0.06] flex flex-col items-center py-3 gap-1 shrink-0">
            {toolButtons.map(({ id, icon: Icon, label, shortcut }) => (
              <button
                key={id}
                onClick={() => setActiveTool(id)}
                title={`${label} (${shortcut})`}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
                  activeTool === id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-[#0f0f1a] overflow-hidden">
            {/* Top Ruler */}
            <div className="absolute top-0 left-6 right-0 h-6 bg-[#0d0d14] border-b border-white/[0.06] z-10">
              <svg width="100%" height="24">
                {Array.from({ length: 30 }).map((_, i) => (
                  <g key={i}>
                    <line x1={i * 50} y1={16} x2={i * 50} y2={24} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                    {i > 0 && (
                      <text x={i * 50 + 2} y={13} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">
                        {i * 50}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Left Ruler */}
            <div className="absolute top-6 left-0 w-6 bottom-7 bg-[#0d0d14] border-r border-white/[0.06] z-10 overflow-hidden">
              <svg width="24" height="100%">
                {Array.from({ length: 20 }).map((_, i) => (
                  <g key={i}>
                    <line x1={16} y1={i * 50} x2={24} y2={i * 50} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                    {i > 0 && (
                      <text
                        x={12}
                        y={i * 50 + 3}
                        fill="rgba(255,255,255,0.3)"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        transform={`rotate(-90, 12, ${i * 50 + 3})`}
                      >
                        {i * 50}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Grid + Drawing Canvas */}
            <div className="absolute top-6 left-6 right-0 bottom-7">
              {/* Grid SVG */}
              {gridOn && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <pattern id="minor-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="major-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                      <rect width="100" height="100" fill="url(#minor-grid)" />
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#major-grid)" />
                </svg>
              )}

              {/* Drawing layer */}
              <svg className="absolute inset-0 w-full h-full">
                {/* Shape 4: Construction line (dashed) */}
                <line x1="100" y1="120" x2="100" y2="320" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" strokeWidth="0.5" />

                {/* Shape 1: Selected Rectangle */}
                <rect x="150" y="120" width="200" height="120" stroke="#6366f1" strokeWidth="1.5" fill="rgba(99,102,241,0.05)" strokeDasharray="6 3" />
                {/* Selection handles */}
                {[
                  [150, 120], [250, 120], [350, 120],
                  [350, 180], [350, 240],
                  [250, 240], [150, 240], [150, 180],
                ].map(([x, y], i) => (
                  <rect key={i} x={x - 3} y={y - 3} width={6} height={6} fill="white" stroke="#6366f1" strokeWidth="1" />
                ))}

                {/* Shape 2: Circle */}
                <circle cx="500" cy="200" r="60" stroke="#8b5cf6" strokeWidth="1.5" fill="transparent" />

                {/* Shape 3: Line with dimension */}
                <line x1="150" y1="300" x2="400" y2="300" stroke="#6366f1" strokeWidth="1" />
                {/* Arrow heads */}
                <polygon points="150,296 150,304 142,300" fill="#6366f1" />
                <polygon points="400,296 400,304 408,300" fill="#6366f1" />
                {/* Dimension text */}
                <text x="275" y="290" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="monospace" textAnchor="middle">250.0mm</text>
              </svg>

              {/* Coordinate display */}
              <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded font-mono pointer-events-none">
                X: 245.3 &nbsp; Y: 112.8
              </div>

              {/* Tool hint bar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-black/50 px-3 py-1 rounded-full pointer-events-none">
                {toolButtons.find((t) => t.id === activeTool)?.label ?? 'Select'} tool — Click and drag to draw
              </div>
            </div>
          </div>

          {/* Right Properties Panel */}
          <div className="w-64 bg-[#0d0d14] border-l border-white/[0.06] flex flex-col shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
              {(['properties', 'layers', 'history'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={cn(
                    'flex-1 py-2.5 text-xs font-medium capitalize transition-colors',
                    rightTab === tab
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {rightTab === 'properties' && (
                <div className="p-4 space-y-5">
                  <p className="text-xs text-indigo-400 uppercase tracking-widest">Selected: Rectangle</p>

                  {/* Position & Size */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Position & Size</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {[['X', '150'], ['Y', '120'], ['W', '200'], ['H', '120']].map(([lbl, val]) => (
                        <div key={lbl}>
                          <label className="text-xs text-gray-500 mb-1 block">{lbl}</label>
                          <input
                            defaultValue={val}
                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Rotation</label>
                      <div className="flex items-center gap-1">
                        <input
                          defaultValue="0"
                          className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                        <span className="text-gray-500 text-xs">°</span>
                      </div>
                    </div>
                  </div>

                  {/* Appearance */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Appearance</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-indigo-500 border border-white/20 shrink-0" />
                        <input
                          defaultValue="#6366F1"
                          className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Stroke width</span>
                          <span className="text-xs text-gray-400">1.5px</span>
                        </div>
                        <input type="range" min="1" max="10" defaultValue="1.5" step="0.5" className="w-full accent-indigo-600" />
                      </div>
                      <div className="flex gap-1">
                        {strokeStyles.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStrokeStyle(s)}
                            className={cn(
                              'flex-1 py-1 rounded text-xs border transition-colors',
                              strokeStyle === s
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20'
                            )}
                          >
                            {s === 'solid' ? '—' : s === 'dashed' ? '- -' : '...'}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-white/20 bg-white/5 shrink-0" />
                        <span className="text-xs text-gray-400">Fill opacity:</span>
                        <span className="text-xs text-white ml-auto">5%</span>
                      </div>
                    </div>
                  </div>

                  {/* Material Tag */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Material Tag</p>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    >
                      {materials.map((m) => (
                        <option key={m} value={m} className="bg-[#0d0d14]">{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Notes</p>
                    <textarea
                      rows={3}
                      placeholder="Add notes..."
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-2 py-2 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                    />
                  </div>
                </div>
              )}

              {rightTab === 'layers' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Layers</p>
                    <button className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      <Plus size={12} /> Add
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {layers.map((layer) => (
                      <div
                        key={layer.name}
                        className={cn(
                          'flex items-center gap-2 h-9 px-2 rounded-md transition-colors cursor-pointer',
                          layer.active ? 'bg-white/5' : 'hover:bg-white/5'
                        )}
                      >
                        <Eye size={13} className="text-gray-400 shrink-0" />
                        <Lock size={13} className={cn('shrink-0', layer.locked ? 'text-amber-400' : 'text-gray-600')} />
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: layer.color }} />
                        <span className={cn('text-xs flex-1', layer.active ? 'text-white font-medium' : 'text-gray-400')}>
                          {layer.name}
                        </span>
                        <GripVertical size={13} className="text-gray-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rightTab === 'history' && (
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">History</p>
                  <div className="space-y-1">
                    {historyItems.map((item, i) => (
                      <div
                        key={i}
                        className={cn(
                          'px-3 py-2 rounded-md cursor-pointer transition-colors text-sm',
                          item.active
                            ? 'bg-indigo-600/15 border-l-2 border-indigo-500'
                            : 'hover:bg-white/5'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn('text-sm', item.active ? 'text-white font-medium' : 'text-gray-400')}>
                            {item.label}
                          </span>
                          <span className="text-xs text-gray-600">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-4">Click an item to restore that state</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="h-7 bg-[#0a0a0f] border-t border-white/[0.06] flex items-center px-4 gap-6 text-xs text-gray-500 shrink-0">
          <span className="text-gray-400">
            {toolButtons.find((t) => t.id === activeTool)?.label ?? 'Select'}
          </span>
          <span>X: 245.3 &nbsp; Y: 112.8</span>
          <span>Zoom: {zoom}%</span>
          <span>3 objects</span>
          <span className={snapOn ? 'text-emerald-500' : 'text-gray-600'}>
            SNAP: {snapOn ? 'ON' : 'OFF'}
          </span>
          <span className={gridOn ? 'text-emerald-500' : 'text-gray-600'}>
            GRID: {gridOn ? 'ON' : 'OFF'}
          </span>
          <span className="ml-auto">Press ? for shortcuts</span>
        </div>
      </div>

      {/* AI Chat Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showChat && (
          <div className="w-72 bg-[#13131f] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h4 className="text-sm font-bold text-white">AI Design Assistant</h4>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="h-48 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-indigo-600/40 text-white'
                        : 'bg-white/[0.06] text-gray-300'
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/[0.06] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Ask about your design..."
                className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim()}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-all hover:scale-105"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  )
}
