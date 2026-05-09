'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

import { cn } from '@/lib/utils'
import { useEditorStore, getGeometry } from '@/components/editor/useEditorStore'
import Canvas from '@/components/editor/Canvas'
import EditorToolbar from '@/components/editor/Toolbar'
import EditorSidebar from '@/components/editor/EditorSidebar'
import { designAPI } from '@/lib/api'
import { useSearchParams } from 'next/navigation'

export default function EditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const store = useEditorStore()
  const { state, setTool, undo, redo, loadAIDesign, canUndo, canRedo } = store

  const [projectName, setProjectName] = useState('Untitled Design')
  const [saving, setSaving] = useState(false)


  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  // Load design if ID in URL
  useEffect(() => {
    const designId = searchParams.get('id')
    if (designId) {
      designAPI.getById(designId).then(design => {
        setProjectName(design.name)
        loadAIDesign(design.data.elements, design.data.constraints)
      }).catch(err => console.error('Failed to load design', err))
    }
  }, [searchParams, loadAIDesign])

  // AI Transfer load
  useEffect(() => {
    const transfer = localStorage.getItem('optiforge_ai_cad_transfer')
    if (transfer) {
      try {
        const data = JSON.parse(transfer)
        if (data.elements) {
          loadAIDesign(data.elements, data.constraints || [])
        }
        localStorage.removeItem('optiforge_ai_cad_transfer')
      } catch (e) {
        console.error('Failed to load AI transfer', e)
      }
    }
  }, [loadAIDesign])

  async function handleSave() {
    setSaving(true)
    try {
      await designAPI.save(projectName, state.elements, state.constraints)
      alert('Design saved successfully!')
    } catch (err) {
      alert('Failed to save design')
    } finally {
      setSaving(false)
    }
  }

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
          onSave={handleSave}
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


    </div>
  )
}
