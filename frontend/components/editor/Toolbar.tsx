'use client'

import { MousePointer, Hand, Minus, Square, Circle, GitMerge, RotateCcw, RotateCw, Hash, Magnet, Trash2, Download, Ruler, Maximize, AlignJustify, Equal, SeparatorHorizontal, SeparatorVertical, Lock, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tool } from './useEditorStore'
import type { useEditorStore } from './useEditorStore'

const TOOLS: { id: Tool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
  { id: 'pan',    icon: Hand,         label: 'Pan',    shortcut: 'H' },
  { id: 'line',   icon: Minus,        label: 'Line',   shortcut: 'L' },
  { id: 'rect',   icon: Square,       label: 'Rect',   shortcut: 'R' },
  { id: 'circle', icon: Circle,       label: 'Circle', shortcut: 'O' },
  { id: 'arc',    icon: GitMerge,     label: 'Arc',    shortcut: 'A' },
  { id: 'dimension', icon: Ruler,      label: 'Dimension', shortcut: 'D' },
]

function ToolBtn({
  icon: Icon, label, shortcut, active, onClick, disabled,
}: {
  icon: React.ElementType; label?: string; shortcut?: string
  active?: boolean; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label && shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
        active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      <Icon size={14} />
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-white/[0.08]" />
}

export default function EditorToolbar({
  store,
  projectName,
  onProjectNameChange,
  onExportSVG,
  onExportDXF,
  onAnalyze,
}: {
  store: ReturnType<typeof useEditorStore>
  projectName: string
  onProjectNameChange: (name: string) => void
  onExportSVG: () => void
  onExportDXF: () => void
  onAnalyze: () => void
  onSave: () => void
}) {
  const { state, setTool, toggleGrid, toggleSnap, undo, redo, resetView, addConstraint, canUndo, canRedo, deleteSelected, setZoom } = store
  const { tool, gridOn, snapOn, zoom, selectedIds } = state

  // Keyboard shortcuts
  // (handled in parent to avoid duplicate listeners)
  const addC = (type: 'parallel' | 'equal' | 'fixed' | 'horizontal' | 'vertical') => {
    if (selectedIds.length === 0) return
    const referenceId = selectedIds[0]
    const otherIds = selectedIds.slice(1)
    
    let value = undefined
    if (type === 'fixed') {
      const el = state.elements.find(e => e.id === referenceId)
      if (el?.type === 'line') value = Math.hypot(el.x2 - el.x1, el.y2 - el.y1)
    }

    addConstraint({
      id: `c-${Date.now()}`,
      type,
      referenceId,
      targetIds: otherIds.length > 0 ? otherIds : [referenceId],
      value
    })
  }

  return (
    <div className="h-12 bg-[#0d0d14] border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
      {/* Project name */}
      <div className="flex items-center gap-2 mr-3 shrink-0">
        <input
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="bg-transparent text-white text-sm font-medium focus:outline-none hover:text-indigo-300 focus:text-white w-36 focus:bg-white/[0.05] focus:px-2 rounded transition-all"
        />
        <span className="text-xs text-emerald-400 font-medium shrink-0">Saved</span>
      </div>

      {/* Center: tools */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {/* Drawing tools */}
        {TOOLS.map(({ id, icon, label, shortcut }) => (
          <ToolBtn
            key={id}
            icon={icon}
            label={label}
            shortcut={shortcut}
            active={tool === id}
            onClick={() => setTool(id)}
          />
        ))}

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn icon={RotateCcw} label="Undo" shortcut="Ctrl+Z" active={false} disabled={!canUndo} onClick={undo} />
        <ToolBtn icon={RotateCw}  label="Redo" shortcut="Ctrl+Y" active={false} disabled={!canRedo} onClick={redo} />

        <Divider />

        {/* Delete */}
        <ToolBtn icon={Trash2} label="Delete selected" active={false} disabled={selectedIds.length === 0} onClick={deleteSelected} />

        <Divider />

        {/* Grid / Snap */}
        <ToolBtn icon={Hash}   label="Toggle Grid" active={gridOn} onClick={toggleGrid} />
        <ToolBtn icon={Magnet} label="Toggle Snap" active={snapOn} onClick={toggleSnap} />

        <Divider />

        {/* Constraints */}
        <div className="flex items-center gap-0.5">
          <ToolBtn icon={SeparatorHorizontal} label="Horizontal" onClick={() => addC('horizontal')} disabled={selectedIds.length === 0} />
          <ToolBtn icon={SeparatorVertical}   label="Vertical"   onClick={() => addC('vertical')}   disabled={selectedIds.length === 0} />
          <ToolBtn icon={AlignJustify}        label="Parallel"   onClick={() => addC('parallel')}   disabled={selectedIds.length < 2} />
          <ToolBtn icon={Equal}               label="Equal"      onClick={() => addC('equal')}      disabled={selectedIds.length < 2} />
          <ToolBtn icon={Lock}                label="Fix Length" onClick={() => addC('fixed')}      disabled={selectedIds.length === 0} />
        </div>

        <Divider />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(zoom / 1.2)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded text-base"
          >−</button>
          <span className="text-xs text-gray-400 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(zoom * 1.2)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded text-base"
          >+</button>
          <ToolBtn icon={Maximize} label="Reset View" onClick={resetView} />
        </div>
      </div>

      {/* Right: export + AI */}
      <div className="flex items-center gap-1 ml-3 shrink-0">
        <button
          onClick={onExportSVG}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
        >
          <Download size={13} /> Export SVG
        </button>
        <button
          onClick={onExportDXF}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
        >
          <Download size={13} /> Export DXF
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold transition-all mr-1"
        >
          <Save size={13} /> Save
        </button>
        <button
          onClick={onAnalyze}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold hover:from-indigo-500 hover:to-indigo-400 transition-all"
        >
          ✦ Analyze with AI
        </button>
      </div>
    </div>
  )
}
