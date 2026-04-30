'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DrawElement, Layer } from './useEditorStore'
import type { useEditorStore } from './useEditorStore'

const strokeStyles = ['solid', 'dashed', 'dotted'] as const
type StrokeStyle = typeof strokeStyles[number]

function toDash(s: StrokeStyle): string | undefined {
  if (s === 'dashed') return '6,3'
  if (s === 'dotted') return '2,2'
  return undefined
}

function fromDash(dash?: string | null): StrokeStyle {
  if (!dash) return 'solid'
  if (dash.startsWith('6')) return 'dashed'
  return 'dotted'
}

export default function EditorSidebar({ store }: { store: ReturnType<typeof useEditorStore> }) {
  const { state, updateElement, updateLayer, addLayer, setActiveLayer, deleteSelected } = store
  const { elements, selectedIds, layers, activeLayerId } = state

  const [tab, setTab] = useState<'properties' | 'layers'>('properties')

  const selected = elements.filter((el) => selectedIds.includes(el.id))
  const firstSel = selected[0] as DrawElement | undefined

  // ── Properties ─────────────────────────────────────────────────────────────
  function patchAll(patch: Partial<DrawElement>) {
    selected.forEach((el) => updateElement(el.id, patch))
  }

  function addNewLayer() {
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    const id = `layer-${Date.now()}`
    addLayer({
      id,
      name: `Layer ${layers.length + 1}`,
      color: colors[layers.length % colors.length],
      visible: true,
      locked: false,
    })
    setActiveLayer(id)
  }

  return (
    <div className="w-64 bg-[#0d0d14] border-l border-white/[0.06] flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(['properties', 'layers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium capitalize transition-colors',
              tab === t ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Properties Tab ──────────────────────────────────────────────── */}
        {tab === 'properties' && (
          <div className="p-4 space-y-5">
            {!firstSel ? (
              <p className="text-xs text-gray-600 text-center mt-8">Select an element to edit properties</p>
            ) : (
              <>
                <p className="text-xs text-indigo-400 uppercase tracking-widest">
                  Selected: {selected.length > 1 ? `${selected.length} elements` : firstSel.type}
                </p>

                {/* Position / Size (single select only) */}
                {selected.length === 1 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Position &amp; Size</p>
                    <div className="grid grid-cols-2 gap-2">
                      {firstSel.type === 'rect' && (
                        <>
                          <PropInput label="X" value={firstSel.x} onChange={(v) => updateElement(firstSel.id, { x: v } as Partial<DrawElement>)} />
                          <PropInput label="Y" value={firstSel.y} onChange={(v) => updateElement(firstSel.id, { y: v } as Partial<DrawElement>)} />
                          <PropInput label="W" value={firstSel.width} onChange={(v) => updateElement(firstSel.id, { width: Math.max(1, v) } as Partial<DrawElement>)} />
                          <PropInput label="H" value={firstSel.height} onChange={(v) => updateElement(firstSel.id, { height: Math.max(1, v) } as Partial<DrawElement>)} />
                        </>
                      )}
                      {(firstSel.type === 'circle' || firstSel.type === 'arc') && (
                        <>
                          <PropInput label="CX" value={firstSel.cx} onChange={(v) => updateElement(firstSel.id, { cx: v } as Partial<DrawElement>)} />
                          <PropInput label="CY" value={firstSel.cy} onChange={(v) => updateElement(firstSel.id, { cy: v } as Partial<DrawElement>)} />
                          <PropInput label="R"  value={firstSel.r}  onChange={(v) => updateElement(firstSel.id, { r: Math.max(1, v) } as Partial<DrawElement>)} />
                        </>
                      )}
                      {firstSel.type === 'line' && (
                        <>
                          <PropInput label="X1" value={firstSel.x1} onChange={(v) => updateElement(firstSel.id, { x1: v } as Partial<DrawElement>)} />
                          <PropInput label="Y1" value={firstSel.y1} onChange={(v) => updateElement(firstSel.id, { y1: v } as Partial<DrawElement>)} />
                          <PropInput label="X2" value={firstSel.x2} onChange={(v) => updateElement(firstSel.id, { x2: v } as Partial<DrawElement>)} />
                          <PropInput label="Y2" value={firstSel.y2} onChange={(v) => updateElement(firstSel.id, { y2: v } as Partial<DrawElement>)} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Appearance */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Appearance</p>
                  <div className="space-y-3">
                    {/* Stroke color */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Stroke</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={firstSel.stroke}
                          onChange={(e) => patchAll({ stroke: e.target.value } as Partial<DrawElement>)}
                          className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                        />
                        <input
                          value={firstSel.stroke}
                          onChange={(e) => patchAll({ stroke: e.target.value } as Partial<DrawElement>)}
                          className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono"
                        />
                      </div>
                    </div>

                    {/* Fill */}
                    {firstSel.type !== 'line' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Fill</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={firstSel.fill === 'none' ? '#000000' : firstSel.fill}
                            onChange={(e) => patchAll({ fill: e.target.value } as Partial<DrawElement>)}
                            className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                          />
                          <input
                            value={firstSel.fill}
                            onChange={(e) => patchAll({ fill: e.target.value } as Partial<DrawElement>)}
                            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Stroke width */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Stroke width</span>
                        <span className="text-xs text-gray-400">{firstSel.strokeWidth}px</span>
                      </div>
                      <input
                        type="range" min={0.5} max={12} step={0.5}
                        value={firstSel.strokeWidth}
                        onChange={(e) => patchAll({ strokeWidth: parseFloat(e.target.value) } as Partial<DrawElement>)}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    {/* Stroke style */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Stroke style</label>
                      <div className="flex gap-1">
                        {strokeStyles.map((s) => (
                          <button
                            key={s}
                            onClick={() => patchAll({ strokeDasharray: toDash(s) })}
                            className={cn(
                              'flex-1 py-1 rounded text-xs border transition-colors',
                              fromDash(firstSel.strokeDasharray) === s
                                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20'
                            )}
                          >
                            {s === 'solid' ? '—' : s === 'dashed' ? '- -' : '···'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Opacity</span>
                        <span className="text-xs text-gray-400">{Math.round(firstSel.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={firstSel.opacity}
                        onChange={(e) => patchAll({ opacity: parseFloat(e.target.value) } as Partial<DrawElement>)}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={deleteSelected}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={12} /> Delete selected
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Layers Tab ──────────────────────────────────────────────────── */}
        {tab === 'layers' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Layers</p>
              <button
                onClick={addNewLayer}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-0.5">
              {layers.map((layer) => (
                <LayerRow
                  key={layer.id}
                  layer={layer}
                  active={layer.id === activeLayerId}
                  elementCount={elements.filter((el) => el.layerId === layer.id).length}
                  onActivate={() => setActiveLayer(layer.id)}
                  onToggleVisible={() => updateLayer(layer.id, { visible: !layer.visible })}
                  onToggleLocked={() => updateLayer(layer.id, { locked: !layer.locked })}
                />
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-4 text-center">
              New elements are placed on the active layer
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PropInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      />
    </div>
  )
}

function LayerRow({ layer, active, elementCount, onActivate, onToggleVisible, onToggleLocked }: {
  layer: Layer; active: boolean; elementCount: number
  onActivate: () => void; onToggleVisible: () => void; onToggleLocked: () => void
}) {
  return (
    <div
      onClick={onActivate}
      className={cn(
        'flex items-center gap-2 h-9 px-2 rounded-md transition-colors cursor-pointer group',
        active ? 'bg-indigo-600/15 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleVisible() }}
        className="text-gray-400 hover:text-white transition-colors shrink-0"
      >
        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-gray-600" />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLocked() }}
        className="shrink-0 transition-colors"
      >
        {layer.locked ? <Lock size={13} className="text-amber-400" /> : <Unlock size={13} className="text-gray-600 hover:text-gray-400" />}
      </button>
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: layer.color }} />
      <span className={cn('text-xs flex-1 truncate', active ? 'text-white font-medium' : 'text-gray-400')}>
        {layer.name}
      </span>
      <span className="text-xs text-gray-600 shrink-0">{elementCount}</span>
    </div>
  )
}
