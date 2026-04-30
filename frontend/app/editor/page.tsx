'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { MessageSquare, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore, getGeometry } from '@/components/editor/useEditorStore'
import Canvas from '@/components/editor/Canvas'
import EditorToolbar from '@/components/editor/Toolbar'
import EditorSidebar from '@/components/editor/EditorSidebar'

export default function EditorPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const store = useEditorStore()
  const { state, setTool, undo, redo, canUndo, canRedo } = store

  const [projectName, setProjectName] = useState('Untitled Design')
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hi! Ask me anything about your design.' },
  ])

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo() }
        if (e.key === 'y') { e.preventDefault(); redo() }
        return
      }
      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break
        case 'h': setTool('pan'); break
        case 'l': setTool('line'); break
        case 'r': setTool('rect'); break
        case 'o': setTool('circle'); break
        case 'a': setTool('arc'); break
        case 'd': setTool('dimension'); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setTool, undo, redo])

  // Export SVG
  function exportSVG() {
    const svgEl = document.getElementById('editor-svg')
    if (!svgEl) return
    const svgContent = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadDXF() {
    const geometry = getGeometry(state)
    try {
      const res = await fetch("http://localhost:5000/api/export/dxf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geometry,
          title: projectName,
          width: 400, // Default bounds if needed
          height: 200
        })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${projectName.replace(/\s+/g, '_')}.dxf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("DXF export failed", err)
    }
  }

  function sendChat() {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }])
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Based on your design, I suggest reviewing the load-bearing joints for optimal performance.' },
      ])
    }, 900)
  }

  if (loading || !user) return null

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <EditorToolbar
          store={store}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onExportSVG={exportSVG}
          onExportDXF={downloadDXF}
          onAnalyze={() => router.push('/optimizer')}
        />

        {/* Main area: left mini toolbar + canvas + right panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left mini toolbar (vertical tool shortcuts) */}
          <div className="w-12 bg-[#0d0d14] border-r border-white/[0.06] flex flex-col items-center py-3 gap-1 shrink-0">
            {(
              [
                { id: 'select' as const, label: 'V', title: 'Select' },
                { id: 'pan'    as const, label: 'H', title: 'Pan' },
                { id: 'line'   as const, label: 'L', title: 'Line' },
                { id: 'rect'   as const, label: 'R', title: 'Rect' },
                { id: 'circle' as const, label: 'O', title: 'Circle' },
                { id: 'arc'    as const, label: 'A', title: 'Arc' },
                { id: 'dimension' as const, label: 'D', title: 'Dimension' },
              ]
            ).map(({ id, label, title }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                title={`${title} (${label})`}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-colors',
                  state.tool === id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-white/10 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}

            <div className="flex-1" />

            {/* Undo/Redo in sidebar */}
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-white/10 hover:text-white text-xs disabled:opacity-30"
            >↩</button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-white/10 hover:text-white text-xs disabled:opacity-30"
            >↪</button>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <Canvas store={store} />
          </div>

          {/* Right panel */}
          <EditorSidebar store={store} />
        </div>

        {/* Status Bar */}
        <div className="h-7 bg-[#0a0a0f] border-t border-white/[0.06] flex items-center px-4 gap-6 text-xs text-gray-500 shrink-0">
          <span className="text-gray-400 capitalize">{state.tool}</span>
          <span>{state.elements.length} objects</span>
          <span>{state.selectedIds.length > 0 ? `${state.selectedIds.length} selected` : 'None selected'}</span>
          <span className={state.snapOn ? 'text-emerald-500' : 'text-gray-600'}>
            SNAP: {state.snapOn ? 'ON' : 'OFF'}
          </span>
          <span className={state.gridOn ? 'text-emerald-500' : 'text-gray-600'}>
            GRID: {state.gridOn ? 'ON' : 'OFF'}
          </span>
          <span className="ml-auto text-gray-600">V=Select H=Pan L=Line R=Rect O=Circle A=Arc D=Dimension · Ctrl+Z/Y Undo/Redo</span>
        </div>
      </div>

      {/* AI Chat */}
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
                  <div className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user' ? 'bg-indigo-600/40 text-white' : 'bg-white/[0.06] text-gray-300'
                  )}>
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
