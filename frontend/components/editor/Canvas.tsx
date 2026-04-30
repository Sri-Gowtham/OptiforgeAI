'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useEditorStore, DrawElement, DimensionElement } from './useEditorStore'

// ─── Snap helper ─────────────────────────────────────────────────────────────
const SNAP = 10
function snap(val: number, on: boolean) {
  return on ? Math.round(val / SNAP) * SNAP : val
}

// ─── ID generator ─────────────────────────────────────────────────────────────
let idCounter = 0
function uid() { return `el-${++idCounter}-${Date.now()}` }

// ─── Arc path builder ─────────────────────────────────────────────────────────
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  const start = s(startAngle)
  const end = s(endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

// ─── Bounding box ─────────────────────────────────────────────────────────────
function getBBox(el: DrawElement | DimensionElement) {
  switch (el.type) {
    case 'line': {
      const minX = Math.min(el.x1, el.x2), minY = Math.min(el.y1, el.y2)
      const maxX = Math.max(el.x1, el.x2), maxY = Math.max(el.y1, el.y2)
      return { x: minX - 4, y: minY - 4, w: maxX - minX + 8, h: maxY - minY + 8 }
    }
    case 'dimension': {
      const minX = Math.min(el.x1, el.x2), minY = Math.min(el.y1, el.y2)
      const maxX = Math.max(el.x1, el.x2), maxY = Math.max(el.y1, el.y2)
      return { x: minX - 4, y: minY - 20, w: maxX - minX + 8, h: maxY - minY + 28 }
    }
    case 'rect':
      return { x: el.x, y: el.y, w: el.width, h: el.height }
    case 'circle':
      return { x: el.cx - el.r, y: el.cy - el.r, w: el.r * 2, h: el.r * 2 }
    case 'arc':
      return { x: el.cx - el.r, y: el.cy - el.r, w: el.r * 2, h: el.r * 2 }
  }
}

// ─── Hit test ────────────────────────────────────────────────────────────────
function hitTest(el: DrawElement, px: number, py: number) {
  const bb = getBBox(el)
  return px >= bb.x && px <= bb.x + bb.w && py >= bb.y && py <= bb.y + bb.h
}

// ─── Element renderer ─────────────────────────────────────────────────────────
function RenderElement({ el, selected }: { el: DrawElement; selected: boolean }) {
  const selStyle = selected
    ? { stroke: '#4f8ef7', strokeDasharray: '5,2', strokeWidth: el.strokeWidth + 0.5 }
    : { stroke: el.stroke, strokeDasharray: el.strokeDasharray, strokeWidth: el.strokeWidth }

  const fill = el.fill || 'none'

  if (el.type === 'line') {
    return <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} {...selStyle} fill="none" opacity={el.opacity} />
  }
  if (el.type === 'rect') {
    return <rect x={el.x} y={el.y} width={el.width} height={el.height} {...selStyle} fill={fill} opacity={el.opacity} />
  }
  if (el.type === 'circle') {
    return <circle cx={el.cx} cy={el.cy} r={el.r} {...selStyle} fill={fill} opacity={el.opacity} />
  }
  if (el.type === 'arc') {
    return <path d={arcPath(el.cx, el.cy, el.r, el.startAngle, el.endAngle)} {...selStyle} fill="none" opacity={el.opacity} />
  }
  if (el.type === 'dimension') {
    const dx = el.x2 - el.x1
    const dy = el.y2 - el.y1
    const len = Math.max(0.1, Math.hypot(dx, dy))
    const nx = -dy / len
    const ny = dx / len
    const off = el.offset ?? 20

    const x1p = el.x1 + nx * off
    const y1p = el.y1 + ny * off
    const x2p = el.x2 + nx * off
    const y2p = el.y2 + ny * off

    const midX = (x1p + x2p) / 2
    const midY = (y1p + y2p) / 2
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    
    // Keep text upright
    let textAngle = angle
    if (textAngle > 90 || textAngle < -90) textAngle += 180

    return (
      <g opacity={el.opacity}>
        <line x1={el.x1} y1={el.y1} x2={x1p} y2={y1p} stroke="#facc15" strokeWidth={0.5} strokeDasharray="2,1" />
        <line x1={el.x2} y1={el.y2} x2={x2p} y2={y2p} stroke="#facc15" strokeWidth={0.5} strokeDasharray="2,1" />
        <line x1={x1p} y1={y1p} x2={x2p} y2={y2p} stroke="#facc15" strokeWidth={1} />
        <path d="M 0 0 L 8 -2.5 L 8 2.5 Z" fill="#facc15" transform={`translate(${x1p},${y1p}) rotate(${angle})`} />
        <path d="M 0 0 L -8 -2.5 L -8 2.5 Z" fill="#facc15" transform={`translate(${x2p},${y2p}) rotate(${angle})`} />
        <text
          x={midX}
          y={midY - 6}
          fill="#facc15"
          fontSize={10}
          textAnchor="middle"
          transform={`rotate(${textAngle}, ${midX}, ${midY})`}
          className="font-mono select-none pointer-events-none"
        >
          {el.label}
        </text>
      </g>
    )
  }
  return null
}

// ─── Selection handles ────────────────────────────────────────────────────────
function SelectionHandles({ el, onResizeStart }: { el: DrawElement; onResizeStart: (handle: string, el: DrawElement, e: React.MouseEvent) => void }) {
  const bb = getBBox(el)
  if (!bb) return null

  const HANDLE_SIZE = 6
  const handles = [
    { key: 'nw', x: bb.x, y: bb.y },
    { key: 'n',  x: bb.x + bb.w / 2, y: bb.y },
    { key: 'ne', x: bb.x + bb.w, y: bb.y },
    { key: 'e',  x: bb.x + bb.w, y: bb.y + bb.h / 2 },
    { key: 'se', x: bb.x + bb.w, y: bb.y + bb.h },
    { key: 's',  x: bb.x + bb.w / 2, y: bb.y + bb.h },
    { key: 'sw', x: bb.x, y: bb.y + bb.h },
    { key: 'w',  x: bb.x, y: bb.y + bb.h / 2 },
  ]

  return (
    <g>
      <rect
        x={bb.x - 1} y={bb.y - 1} width={bb.w + 2} height={bb.h + 2}
        fill="none" stroke="#4f8ef7" strokeWidth={0.5} strokeDasharray="4,2" pointerEvents="none"
      />
      {handles.map(({ key, x, y }) => (
        <rect
          key={key}
          x={x - HANDLE_SIZE / 2} y={y - HANDLE_SIZE / 2}
          width={HANDLE_SIZE} height={HANDLE_SIZE}
          fill="white" stroke="#4f8ef7" strokeWidth={1}
          style={{ cursor: `${key}-resize` }}
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(key, el, e) }}
        />
      ))}
    </g>
  )
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────
export default function Canvas({ store }: { store: ReturnType<typeof useEditorStore> }) {
  const { state, addElement, updateElement, setSelected, toggleSelect, setOffset, setZoom } = store
  const { tool, elements, selectedIds, zoom, offset, gridOn, snapOn, layers, activeLayerId } = state

  const svgRef = useRef<SVGSVGElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 })
  const [preview, setPreview] = useState<DrawElement | null>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  // Dimension tool: first point already placed?
  const [dimPt1, setDimPt1] = useState<{ x: number; y: number } | null>(null)

  // Pan state
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panOffset = useRef(offset)

  // Move state
  const isMoving = useRef(false)
  const moveStart = useRef({ x: 0, y: 0 })
  const moveEls = useRef<DrawElement[]>([])

  // Resize state
  const isResizing = useRef(false)
  const resizeHandle = useRef('')
  const resizeEl = useRef<DrawElement | null>(null)
  const resizeStart = useRef({ x: 0, y: 0 })

  // Keep panOffset in sync
  useEffect(() => { panOffset.current = offset }, [offset])

  // SVG coordinates from mouse event
  const getSVGPoint = useCallback((e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const raw = {
      x: (e.clientX - rect.left - offset.x) / zoom,
      y: (e.clientY - rect.top - offset.y) / zoom,
    }
    return { x: snap(raw.x, snapOn), y: snap(raw.y, snapOn) }
  }, [offset, zoom, snapOn])

  const getClientPoint = useCallback((e: React.MouseEvent) => {
    return { x: e.clientX, y: e.clientY }
  }, [])

  function defaultProps(layerId: string) {
    const layer = layers.find((l) => l.id === layerId)
    return {
      id: uid(),
      layerId,
      stroke: layer?.color ?? '#6366f1',
      strokeWidth: 1.5,
      fill: 'none',
      opacity: 1,
      visible: true,
      locked: false,
    }
  }

  function buildPreview(start: { x: number; y: number }, cur: { x: number; y: number }): DrawElement | null {
    const base = defaultProps(activeLayerId)
    if (tool === 'line') {
      return { ...base, type: 'line', x1: start.x, y1: start.y, x2: cur.x, y2: cur.y }
    }
    if (tool === 'rect') {
      return {
        ...base, type: 'rect',
        x: Math.min(start.x, cur.x), y: Math.min(start.y, cur.y),
        width: Math.abs(cur.x - start.x), height: Math.abs(cur.y - start.y),
      }
    }
    if (tool === 'circle') {
      const r = Math.hypot(cur.x - start.x, cur.y - start.y)
      return { ...base, type: 'circle', cx: start.x, cy: start.y, r }
    }
    if (tool === 'arc') {
      const r = Math.hypot(cur.x - start.x, cur.y - start.y)
      const startAngle = Math.atan2(cur.y - start.y, cur.x - start.x)
      return { ...base, type: 'arc', cx: start.x, cy: start.y, r, startAngle, endAngle: startAngle + Math.PI }
    }
    if (tool === 'dimension' && dimPt1) {
      const dist = Math.hypot(cur.x - dimPt1.x, cur.y - dimPt1.y)
      const UNIT_SCALE = 1
      return {
        ...base,
        stroke: '#facc15', strokeWidth: 1, fill: 'none',
        type: 'dimension',
        x1: dimPt1.x, y1: dimPt1.y, x2: cur.x, y2: cur.y,
        distance: dist,
        label: `${(dist * UNIT_SCALE).toFixed(1)} mm`,
        offset: 25,
        orientation: 'aligned'
      }
    }
    return null
  }

  // ── Mouse Down ────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return

    // Pan tool
    if (tool === 'pan') {
      isPanning.current = true
      panStart.current = { x: e.clientX - panOffset.current.x, y: e.clientY - panOffset.current.y }
      return
    }

    const pt = getSVGPoint(e)

    // Select tool
    if (tool === 'select') {
      // Hit test elements in reverse (top-most first)
      const hit = [...elements].reverse().find((el) => {
        const layer = layers.find((l) => l.id === el.layerId)
        if (!layer?.visible || el.locked) return false
        return hitTest(el, pt.x, pt.y)
      })

      if (hit) {
        if (e.shiftKey) {
          toggleSelect(hit.id)
        } else {
          if (!selectedIds.includes(hit.id)) setSelected([hit.id])
        }
        // Prepare for move
        isMoving.current = true
        moveStart.current = getClientPoint(e)
        moveEls.current = elements.filter((el) =>
          (e.shiftKey ? [...selectedIds, hit.id] : [hit.id]).includes(el.id)
        )
      } else {
        if (!e.shiftKey) setSelected([])
      }
      return
    }

    // Drawing tools
    // Dimension: two-click workflow
    if (tool === 'dimension') {
      if (!dimPt1) {
        // First click — store point A
        setDimPt1(pt)
      } else {
        // Second click — commit dimension
        const dist = Math.hypot(pt.x - dimPt1.x, pt.y - dimPt1.y)
        if (dist > 2) {
          const base = defaultProps(activeLayerId)
          const UNIT_SCALE = 1
          addElement({
            ...base,
            stroke: '#facc15', strokeWidth: 1, fill: 'none',
            type: 'dimension',
            x1: dimPt1.x, y1: dimPt1.y, x2: pt.x, y2: pt.y,
            distance: dist,
            label: `${(dist * UNIT_SCALE).toFixed(1)} mm`,
            offset: 25,
            orientation: 'aligned'
          })
        }
        setDimPt1(null)
        setPreview(null)
      }
      return
    }

    setDrawing(true)
    setDrawStart(pt)
    setPreview(buildPreview(pt, pt))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, elements, layers, selectedIds, getSVGPoint, getClientPoint, toggleSelect, setSelected, activeLayerId, dimPt1])

  // ── Mouse Move ────────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const svgRect = svgRef.current!.getBoundingClientRect()
    const rawX = (e.clientX - svgRect.left - offset.x) / zoom
    const rawY = (e.clientY - svgRect.top - offset.y) / zoom
    setCursor({ x: Math.round(rawX), y: Math.round(rawY) })

    // Pan
    if (isPanning.current) {
      const newOffset = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }
      panOffset.current = newOffset
      setOffset(newOffset)
      return
    }

    // Move selected elements
    if (isMoving.current && selectedIds.length > 0) {
      const dx = (e.clientX - moveStart.current.x) / zoom
      const dy = (e.clientY - moveStart.current.y) / zoom
      moveEls.current.forEach((el) => {
        const patch = moveElement(el, snap(dx, snapOn), snap(dy, snapOn))
        updateElement(el.id, patch)
      })
      moveStart.current = getClientPoint(e)
      moveEls.current = elements.filter((el) => selectedIds.includes(el.id))
      return
    }

    // Resize
    if (isResizing.current && resizeEl.current) {
      const dx = (e.clientX - resizeStart.current.x) / zoom
      const dy = (e.clientY - resizeStart.current.y) / zoom
      resizeStart.current = getClientPoint(e)
      const patch = resizeElement(resizeEl.current, resizeHandle.current, dx, dy)
      if (patch) {
        updateElement(resizeEl.current.id, patch)
        resizeEl.current = { ...resizeEl.current, ...patch } as DrawElement
      }
      return
    }

    // Drawing preview
    if (drawing) {
      const pt = getSVGPoint(e)
      setPreview(buildPreview(drawStart, pt))
    }
    // Dimension preview (after first click)
    if (tool === 'dimension' && dimPt1) {
      const pt = getSVGPoint(e)
      const dist = Math.hypot(pt.x - dimPt1.x, pt.y - dimPt1.y)
      const base = defaultProps(activeLayerId)
      const UNIT_SCALE = 1
      setPreview({
        ...base,
        stroke: '#facc15', strokeWidth: 1, fill: 'none',
        type: 'dimension',
        x1: dimPt1.x, y1: dimPt1.y, x2: pt.x, y2: pt.y,
        distance: dist,
        label: `${(dist * UNIT_SCALE).toFixed(1)} mm`,
        offset: 25,
        orientation: 'aligned'
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing, drawStart, tool, offset, zoom, snapOn, selectedIds, elements, getSVGPoint, setOffset, updateElement, getClientPoint, activeLayerId, dimPt1])

  // ── Mouse Up ──────────────────────────────────────────────────────────────
  const onMouseUp = useCallback(() => {
    isPanning.current = false
    isMoving.current = false
    isResizing.current = false
    resizeEl.current = null

    if (drawing && preview) {
      // Only add if has meaningful size
      let valid = false
      if (preview.type === 'line') valid = Math.hypot(preview.x2 - preview.x1, preview.y2 - preview.y1) > 2
      if (preview.type === 'rect') valid = preview.width > 2 && preview.height > 2
      if (preview.type === 'circle') valid = preview.r > 2
      if (preview.type === 'arc') valid = preview.r > 2
      if (valid) addElement(preview)
    }
    setDrawing(false)
    setPreview(null)
  }, [drawing, preview, addElement])

  // ── Wheel Zoom ────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setZoom(zoom * factor)
  }, [zoom, setZoom])

  // ── Resize start (called from handle) ────────────────────────────────────
  const handleResizeStart = useCallback((handle: string, el: DrawElement, e: React.MouseEvent) => {
    isResizing.current = true
    resizeHandle.current = handle
    resizeEl.current = el
    resizeStart.current = getClientPoint(e)
  }, [getClientPoint])

  // Keyboard delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement?.tagName !== 'INPUT') {
        store.deleteSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [store])

  // Cursor style
  const cursorStyle = tool === 'pan' ? (isPanning.current ? 'grabbing' : 'grab')
    : tool === 'select' ? 'default'
    : 'crosshair'

  const visibleLayers = new Set(layers.filter((l) => l.visible).map((l) => l.id))

  const GRID = 10
  const MAJOR = 100

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f0f1a]">
      <svg
        id="editor-svg"
        ref={svgRef}
        className="w-full h-full select-none"
        style={{ cursor: cursorStyle }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
          {/* Grid */}
          {gridOn && (
            <g pointerEvents="none">
              <defs>
                <pattern id="cad-minor" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth={0.5} />
                </pattern>
                <pattern id="cad-major" width={MAJOR} height={MAJOR} patternUnits="userSpaceOnUse">
                  <rect width={MAJOR} height={MAJOR} fill="url(#cad-minor)" />
                  <path d={`M ${MAJOR} 0 L 0 0 0 ${MAJOR}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                </pattern>
              </defs>
              <rect x={-5000} y={-5000} width={15000} height={15000} fill="url(#cad-major)" />
              {/* Axis lines */}
              <line x1={-5000} y1={0} x2={10000} y2={0} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
              <line x1={0} y1={-5000} x2={0} y2={10000} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
            </g>
          )}

          {/* Elements */}
          {elements.map((el) => {
            if (!visibleLayers.has(el.layerId)) return null
            const selected = selectedIds.includes(el.id)
            return (
              <g key={el.id}>
                <RenderElement el={el} selected={selected} />
                {selected && (
                  <SelectionHandles el={el} onResizeStart={handleResizeStart} />
                )}
              </g>
            )
          })}

          {/* Drawing preview */}
          {preview && (
            <g opacity={0.7} pointerEvents="none">
              <RenderElement el={preview} selected={false} />
            </g>
          )}

          {/* Crosshair cursor */}
          {tool !== 'select' && tool !== 'pan' && (
            <g pointerEvents="none" opacity={0.3}>
              <line x1={cursor.x - 12} y1={cursor.y} x2={cursor.x + 12} y2={cursor.y} stroke="white" strokeWidth={0.5} />
              <line x1={cursor.x} y1={cursor.y - 12} x2={cursor.x} y2={cursor.y + 12} stroke="white" strokeWidth={0.5} />
            </g>
          )}
        </g>
      </svg>

      {/* Coordinate display */}
      <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-black/60 px-2 py-1 rounded font-mono pointer-events-none">
        X: {cursor.x} &nbsp; Y: {cursor.y} &nbsp;|&nbsp; Zoom: {Math.round(zoom * 100)}%
      </div>

      {/* Tool hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-black/60 px-3 py-1 rounded-full pointer-events-none">
        {tool === 'select' ? 'Click to select · Shift+click multi-select · Drag to move · Del to delete'
          : tool === 'pan' ? 'Drag to pan · Scroll to zoom'
          : tool === 'line' ? 'Click + drag to draw line'
          : tool === 'rect' ? 'Click + drag to draw rectangle'
          : tool === 'circle' ? 'Click center, drag for radius'
          : tool === 'dimension'
            ? (dimPt1 ? 'Click second point to complete measurement' : 'Click first point to start measurement')
          : 'Click center, drag for arc radius'}
      </div>
    </div>
  )
}

// ─── Move helpers ─────────────────────────────────────────────────────────────
function moveElement(el: DrawElement, dx: number, dy: number): Partial<DrawElement> {
  if (el.type === 'line') return { x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy }
  if (el.type === 'rect') return { x: el.x + dx, y: el.y + dy }
  if (el.type === 'circle' || el.type === 'arc') return { cx: el.cx + dx, cy: el.cy + dy }
  return {}
}

// ─── Resize helpers ───────────────────────────────────────────────────────────
function resizeElement(el: DrawElement, handle: string, dx: number, dy: number): Partial<DrawElement> | null {
  if (el.type === 'rect') {
    let { x, y, width, height } = el
    if (handle.includes('w')) { x += dx; width -= dx }
    if (handle.includes('e')) { width += dx }
    if (handle.includes('n')) { y += dy; height -= dy }
    if (handle.includes('s')) { height += dy }
    return { x, y, width: Math.max(1, width), height: Math.max(1, height) }
  }
  if (el.type === 'circle' || el.type === 'arc') {
    const newR = Math.max(2, el.r + (Math.abs(dx) > Math.abs(dy) ? dx : dy))
    return { r: newR }
  }
  if (el.type === 'line') {
    if (handle === 'nw' || handle === 'sw' || handle === 'w') return { x1: el.x1 + dx, y1: el.y1 + dy }
    return { x2: el.x2 + dx, y2: el.y2 + dy }
  }
  return null
}
