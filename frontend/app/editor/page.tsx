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
import EditorSaveBar from '@/components/EditorSaveBar';
import { useAutosave, EditorSaveState } from '@/lib/editorPersistence';


export default function EditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const store = useEditorStore()
  const { state, setTool, undo, redo, loadAIDesign, canUndo, canRedo } = store

  const [projectName, setProjectName] = useState('Untitled Design')
  const [saving, setSaving] = useState(false)
  const [loadingProject, setLoadingProject] = useState(false)
  const [projectError, setProjectError] = useState<string | null>(null)

  const { setZoom, setOffset } = store

  const getEditorState = useCallback((): EditorSaveState => ({
    metadata: {
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
      designType: 'mechanical',
    },
    elements: state.elements || [],
    layers: state.layers || [],
    constraints: state.constraints || [],
    dimensions: [],
    zoom: state.zoom || 1,
    pan: state.offset || { x: 0, y: 0 },
  }), [projectName, state.elements, state.layers, state.constraints, state.zoom, state.offset]);

  useAutosave(getEditorState);

  const handleLoadState = useCallback((s: EditorSaveState) => {
    loadAIDesign(s.elements || [], s.constraints || []);
    if (typeof s.zoom === 'number') setZoom(s.zoom);
    if (s.pan) setOffset(s.pan);
    if (s.metadata?.name) setProjectName(s.metadata.name);
  }, [loadAIDesign, setZoom, setOffset, setProjectName]);


  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  // Load design if ID in URL
  useEffect(() => {
    const designId = searchParams.get('id')
    if (designId) {
      console.log(`[Editor] Attempting to load project ID: ${designId}`);
      setLoadingProject(true);
      setProjectError(null);
      
      designAPI.getById(designId)
        .then(design => {
          console.log('[Editor] Backend design loaded successfully');
          setProjectName(design.name)
          loadAIDesign(design.data.elements, design.data.constraints)
        })
        .catch(async (err) => {
          console.warn('[Editor] Backend load failed, checking LocalStorage fallback...', err.message);
          
          // Fallback: Check if it's a metadata-only project in localStorage
          try {
            const sessionRaw = localStorage.getItem("optiforge_session");
            const email = sessionRaw ? JSON.parse(sessionRaw).email : null;
            if (email) {
              const projects: any[] = JSON.parse(localStorage.getItem(`optiforge_projects_${email}`) || "[]");
              const localProj = projects.find(p => p.id === designId);
              if (localProj) {
                console.log('[Editor] Found local metadata project:', localProj.name);
                setProjectName(localProj.name);
                // Starts with empty canvas if no backend data
              } else {
                setProjectError('The requested project could not be found in the backend or local storage.');
              }
            } else {
              setProjectError('Session not found. Please log in again.');
            }
          } catch (fallbackErr) {
            console.error('[Editor] Fallback check failed:', fallbackErr);
            setProjectError('Failed to load project data.');
          }
        })
        .finally(() => setLoadingProject(false));
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
        
        <div className="bg-[#0d0d14] border-b border-white/[0.06] px-4 py-1 flex justify-center">
          <EditorSaveBar
            getState={getEditorState}
            onLoad={handleLoadState}
            designName={projectName}
            onNameChange={setProjectName}
          />
        </div>


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

            {/* Loading/Error Overlays */}
            {loadingProject && (
              <div className="absolute inset-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">Fetching design data...</p>
              </div>
            )}

            {projectError && (
              <div className="absolute inset-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl font-bold">!</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
                <p className="text-gray-400 text-sm max-w-md mb-8">{projectError}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-sm font-semibold transition-all"
                  >
                    Back to Dashboard
                  </button>
                  <button 
                    onClick={() => setProjectError(null)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-all"
                  >
                    New Design
                  </button>
                </div>
              </div>
            )}
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
