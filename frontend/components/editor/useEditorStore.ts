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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pushHistory(state: EditorState): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(state.elements)
  return { ...state, history: newHistory, historyIndex: newHistory.length - 1 }
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
      return {
        ...next,
        elements: next.elements.map((el) =>
          el.id === action.id ? ({ ...el, ...action.patch } as DrawElement) : el
        ),
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

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  return { state, setTool, addElement, updateElement, deleteSelected, setSelected, toggleSelect,
    setZoom, setOffset, toggleGrid, toggleSnap, addLayer, updateLayer, setActiveLayer,
    undo, redo, canUndo, canRedo }
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
