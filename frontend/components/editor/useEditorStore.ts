'use client'

import { useReducer, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tool = 'select' | 'pan' | 'line' | 'rect' | 'circle' | 'arc' | 'dimension'

export interface BaseElement {
  id: string
  layerId: string
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  fill: string
  opacity: number
  visible: boolean
  locked: boolean
}

export interface LineElement extends BaseElement {
  type: 'line'
  x1: number; y1: number; x2: number; y2: number
}

export interface RectElement extends BaseElement {
  type: 'rect'
  x: number; y: number; width: number; height: number
}

export interface CircleElement extends BaseElement {
  type: 'circle'
  cx: number; cy: number; r: number
}

export interface ArcElement extends BaseElement {
  type: 'arc'
  cx: number; cy: number; r: number
  startAngle: number; endAngle: number
}

export interface DimensionElement extends BaseElement {
  type: 'dimension'
  x1: number; y1: number; x2: number; y2: number
  distance: number
  label: string
  offset: number
  orientation: 'aligned' | 'horizontal' | 'vertical'
}

export interface Constraint {
  id: string
  type: 'parallel' | 'equal' | 'fixed' | 'horizontal' | 'vertical'
  referenceId: string   // master element
  targetIds: string[]    // dependent elements
  value?: number
}

export type DrawElement = LineElement | RectElement | CircleElement | ArcElement | DimensionElement

export interface Layer {
  id: string
  name: string
  color: string
  visible: boolean
  locked: boolean
}

export interface EditorState {
  elements: DrawElement[]
  selectedIds: string[]
  tool: Tool
  zoom: number
  offset: { x: number; y: number }
  gridOn: boolean
  snapOn: boolean
  layers: Layer[]
  activeLayerId: string
  constraints: Constraint[]
  history: DrawElement[][]
  historyIndex: number
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'ADD_ELEMENT'; element: DrawElement }
  | { type: 'UPDATE_ELEMENT'; id: string; patch: Partial<DrawElement> }
  | { type: 'DELETE_SELECTED' }
  | { type: 'SET_SELECTED'; ids: string[] }
  | { type: 'TOGGLE_SELECT'; id: string }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_OFFSET'; offset: { x: number; y: number } }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'ADD_LAYER'; layer: Layer }
  | { type: 'UPDATE_LAYER'; id: string; patch: Partial<Layer> }
  | { type: 'SET_ACTIVE_LAYER'; id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_VIEW' }
  | { type: 'ADD_CONSTRAINT'; constraint: Constraint }
  | { type: 'LOAD_AI_DESIGN'; elements: DrawElement[]; constraints: Constraint[] }

declare global {
  interface Window {
    DEBUG_CONSTRAINTS: boolean
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pushHistory(state: EditorState): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(state.elements)
  return { ...state, history: newHistory, historyIndex: newHistory.length - 1 }
}

function getDependencyGraph(constraints: Constraint[]) {
  const adj: Record<string, string[]> = {}
  constraints.forEach(c => {
    if (!adj[c.referenceId]) adj[c.referenceId] = []
    c.targetIds.forEach(tid => { if (tid !== c.referenceId) adj[c.referenceId].push(tid) })
  })
  return adj
}

function topologicalSort(constraints: Constraint[]) {
  const adj = getDependencyGraph(constraints)
  const visited = new Set<string>(), result: string[] = [], temp = new Set<string>()
  const visit = (node: string) => {
    if (temp.has(node)) throw new Error("Cycle detected")
    if (visited.has(node)) return
    temp.add(node)
    ;(adj[node] || []).forEach(visit)
    temp.delete(node)
    visited.add(node)
    result.push(node)
  }
  const nodes = new Set([...Object.keys(adj), ...Object.values(adj).flat()])
  nodes.forEach(node => { if (!visited.has(node)) visit(node) })
  return result.reverse()
}

function createsCycle(newC: Constraint, existing: Constraint[]) {
  try { topologicalSort([...existing, newC]); return false } catch { return true }
}

function applyConstraints(elements: DrawElement[], constraints: Constraint[], changedId?: string): DrawElement[] {
  const prevState = [...elements]
  try {
    const sortedNodes = topologicalSort(constraints)
    const sorted = [...constraints].sort((a, b) => sortedNodes.indexOf(a.referenceId) - sortedNodes.indexOf(b.referenceId))
    
    if (window.DEBUG_CONSTRAINTS) {
      console.log("Graph:", getDependencyGraph(constraints))
      console.log("Solve Order:", sortedNodes)
    }

    let next = [...elements]
    const PRIORITY: Record<string, number> = { fixed: 4, horizontal: 3, vertical: 3, equal: 2, parallel: 1 }
    
    for (let i = 0; i < 5; i++) {
      sorted.forEach(c => {
        if (c.type === 'horizontal') {
          next = next.map(el => (c.targetIds.includes(el.id) && el.type === 'line') ? { ...el, y2: el.y1 } : el)
        } else if (c.type === 'vertical') {
          next = next.map(el => (c.targetIds.includes(el.id) && el.type === 'line') ? { ...el, x2: el.x1 } : el)
        } else if (c.type === 'fixed') {
          next = next.map(el => {
            if (el.id === c.referenceId) return { ...el, locked: true }
            if (c.targetIds.includes(el.id) && el.type === 'line' && c.value) {
              const dx = el.x2 - el.x1, dy = el.y2 - el.y1, len = Math.hypot(dx, dy)
              if (len === 0) return el
              return { ...el, x2: el.x1 + (dx / len) * c.value, y2: el.y1 + (dy / len) * c.value }
            }
            return el
          })
        } else if (c.type === 'equal') {
          const ref = next.find(el => el.id === c.referenceId)
          if (ref?.type === 'line') {
            const rLen = Math.hypot(ref.x2 - ref.x1, ref.y2 - ref.y1)
            next = next.map(el => {
              if (c.targetIds.includes(el.id) && el.type === 'line') {
                const dx = el.x2 - el.x1, dy = el.y2 - el.y1, len = Math.hypot(dx, dy)
                if (len === 0) return el
                return { ...el, x2: el.x1 + (dx / len) * rLen, y2: el.y1 + (dy / len) * rLen }
              }
              return el
            })
          }
        } else if (c.type === 'parallel') {
          const ref = next.find(el => el.id === c.referenceId)
          if (ref?.type === 'line') {
            const rdx = ref.x2 - ref.x1, rdy = ref.y2 - ref.y1, rLen = Math.hypot(rdx, rdy)
            if (rLen === 0) return
            next = next.map(el => {
              if (c.targetIds.includes(el.id) && el.type === 'line') {
                const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1)
                return { ...el, x2: el.x1 + (rdx / rLen) * len, y2: el.y1 + (rdy / rLen) * len }
              }
              return el
            })
          }
        }
      })
    }
    return next
  } catch (e) {
    if (window.DEBUG_CONSTRAINTS) console.warn("Solver unstable, reverting:", e)
    return prevState
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, tool: action.tool, selectedIds: [] }

    case 'ADD_ELEMENT': {
      const next = pushHistory(state)
      return { ...next, elements: [...next.elements, action.element] }
    }

    case 'UPDATE_ELEMENT': {
      const next = pushHistory(state)
      const updated = next.elements.map((el) =>
        el.id === action.id ? ({ ...el, ...action.patch } as DrawElement) : el
      )
      return {
        ...next,
        elements: applyConstraints(updated, next.constraints)
      }
    }

    case 'DELETE_SELECTED': {
      if (state.selectedIds.length === 0) return state
      const next = pushHistory(state)
      return {
        ...next,
        elements: next.elements.filter((el) => !state.selectedIds.includes(el.id)),
        selectedIds: [],
      }
    }

    case 'SET_SELECTED':
      return { ...state, selectedIds: action.ids }

    case 'TOGGLE_SELECT': {
      const already = state.selectedIds.includes(action.id)
      return {
        ...state,
        selectedIds: already
          ? state.selectedIds.filter((id) => id !== action.id)
          : [...state.selectedIds, action.id],
      }
    }

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.zoom)) }

    case 'SET_OFFSET':
      return { ...state, offset: action.offset }

    case 'TOGGLE_GRID':
      return { ...state, gridOn: !state.gridOn }

    case 'TOGGLE_SNAP':
      return { ...state, snapOn: !state.snapOn }

    case 'ADD_LAYER':
      return { ...state, layers: [...state.layers, action.layer] }

    case 'UPDATE_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l
        ),
      }

    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.id }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return { ...state, elements: state.history[newIndex], historyIndex: newIndex, selectedIds: [] }
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return { ...state, elements: state.history[newIndex], historyIndex: newIndex, selectedIds: [] }
    }

    case 'RESET_VIEW':
      return { ...state, zoom: 1, offset: { x: 0, y: 0 } }

    case 'ADD_CONSTRAINT': {
      if (createsCycle(action.constraint, state.constraints)) {
        console.warn("Constraint rejected: Creating circular dependency")
        return state
      }

      // Conflict detection
      const affectedIds = [action.constraint.referenceId, ...action.constraint.targetIds]
      const existing = state.constraints.filter(c => [c.referenceId, ...c.targetIds].some(id => affectedIds.includes(id)))
      const hasHVConflict = (action.constraint.type === 'horizontal' && existing.some(e => e.type === 'vertical')) ||
                            (action.constraint.type === 'vertical' && existing.some(e => e.type === 'horizontal'))
      if (hasHVConflict) {
        console.warn("Constraint conflict: Cannot apply Horizontal and Vertical to same element")
        return state
      }

      const next = pushHistory(state)
      return {
        ...next,
        constraints: [...next.constraints, action.constraint],
        elements: applyConstraints(next.elements, [...next.constraints, action.constraint])
      }
    }

    case 'LOAD_AI_DESIGN': {
      console.log('[AI LOAD] Reducer processing elements:', action.elements?.length);
      // Auto center
      if (!action.elements || action.elements.length === 0) {
        console.warn('[AI LOAD] Empty geometry received, resetting state');
        return { ...state, elements: [], constraints: [] }
      }
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      action.elements.forEach(el => {
        if (el.type === 'rect') {
          minX = Math.min(minX, el.x); minY = Math.min(minY, el.y)
          maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height)
        } else if (el.type === 'circle') {
          minX = Math.min(minX, el.cx - el.r); minY = Math.min(minY, el.cy - el.r)
          maxX = Math.max(maxX, el.cx + el.r); maxY = Math.max(maxY, el.cy + el.r)
        } else if (el.type === 'line') {
          minX = Math.min(minX, el.x1, el.x2); minY = Math.min(minY, el.y1, el.y2)
          maxX = Math.max(maxX, el.x1, el.x2); maxY = Math.max(maxY, el.y1, el.y2)
        }
      })
      
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const offset = { x: -centerX, y: -centerY }

      return {
        ...state,
        elements: action.elements,
        constraints: action.constraints,
        zoom: 1,
        offset,
        history: [action.elements],
        historyIndex: 0
      }
    }

    default:
      return state
  }
}

// ─── Initial State ────────────────────────────────────────────────────────────

const DEFAULT_LAYER: Layer = { id: 'layer-1', name: 'Layer 1', color: '#6366f1', visible: true, locked: false }

const initialState: EditorState = {
  elements: [],
  selectedIds: [],
  tool: 'select',
  zoom: 1,
  offset: { x: 0, y: 0 },
  gridOn: true,
  snapOn: true,
  layers: [DEFAULT_LAYER],
  activeLayerId: 'layer-1',
  constraints: [],
  history: [[]],
  historyIndex: 0,
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEditorStore() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const setTool = useCallback((tool: Tool) => dispatch({ type: 'SET_TOOL', tool }), [])
  const addElement = useCallback((element: DrawElement) => dispatch({ type: 'ADD_ELEMENT', element }), [])
  const updateElement = useCallback((id: string, patch: Partial<DrawElement>) =>
    dispatch({ type: 'UPDATE_ELEMENT', id, patch }), [])
  const deleteSelected = useCallback(() => dispatch({ type: 'DELETE_SELECTED' }), [])
  const setSelected = useCallback((ids: string[]) => dispatch({ type: 'SET_SELECTED', ids }), [])
  const toggleSelect = useCallback((id: string) => dispatch({ type: 'TOGGLE_SELECT', id }), [])
  const setZoom = useCallback((zoom: number) => dispatch({ type: 'SET_ZOOM', zoom }), [])
  const setOffset = useCallback((offset: { x: number; y: number }) => dispatch({ type: 'SET_OFFSET', offset }), [])
  const toggleGrid = useCallback(() => dispatch({ type: 'TOGGLE_GRID' }), [])
  const toggleSnap = useCallback(() => dispatch({ type: 'TOGGLE_SNAP' }), [])
  const addLayer = useCallback((layer: Layer) => dispatch({ type: 'ADD_LAYER', layer }), [])
  const updateLayer = useCallback((id: string, patch: Partial<Layer>) =>
    dispatch({ type: 'UPDATE_LAYER', id, patch }), [])
  const setActiveLayer = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE_LAYER', id }), [])
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])
  const resetView = useCallback(() => dispatch({ type: 'RESET_VIEW' }), [])
  const addConstraint = useCallback((constraint: Constraint) => dispatch({ type: 'ADD_CONSTRAINT', constraint }), [])
  const loadAIDesign = useCallback((elements: DrawElement[], constraints: Constraint[]) => {
    console.log('[AI LOAD] Hook called with elements:', elements?.length);
    dispatch({ type: 'LOAD_AI_DESIGN', elements, constraints });
  }, [])

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  return { state, setTool, addElement, updateElement, deleteSelected, setSelected, toggleSelect,
    setZoom, setOffset, toggleGrid, toggleSnap, addLayer, updateLayer, setActiveLayer,
    undo, redo, resetView, addConstraint, loadAIDesign, canUndo, canRedo }
}

// ─── Geometry selector (unified format for SVG + DXF export) ─────────────────

export interface GeometryShape {
  type: 'line' | 'rect' | 'circle' | 'arc' | 'dimension'
  // line / dimension
  x1?: number; y1?: number; x2?: number; y2?: number
  // rect
  x?: number; y?: number; width?: number; height?: number
  // circle / arc
  cx?: number; cy?: number; r?: number
  startAngle?: number; endAngle?: number
  // dimension
  distance?: number; label?: string; offset?: number; orientation?: string
}

export const getGeometry = (state: EditorState) => {
  return state.elements
    .filter((el) => {
      const layer = state.layers.find((l) => l.id === el.layerId)
      return layer?.visible !== false
    })
    .map((el) => {
      switch (el.type) {
        case 'rect':
          return { type: 'rect', x: el.x, y: el.y, width: el.width, height: el.height }
        case 'circle':
          return { type: 'circle', cx: el.cx, cy: el.cy, r: el.r }
        case 'line':
          return { type: 'line', x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }
        case 'arc':
          return { type: 'arc', cx: el.cx, cy: el.cy, r: el.r, startAngle: el.startAngle, endAngle: el.endAngle }
        case 'dimension':
          return {
            type: 'dimension',
            x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2,
            distance: el.distance, label: el.label,
            offset: el.offset, orientation: el.orientation
          }
        default:
          return null
      }
    })
    .filter(Boolean) as GeometryShape[]
}
