import { useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'optiforge-editor-save';
const AUTOSAVE_INTERVAL = 10000;

export interface EditorMetadata {
  name: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  designType: 'mechanical' | 'architectural' | 'general';
}

export interface EditorSaveState {
  metadata: EditorMetadata;
  elements: any[];
  layers: any[];
  constraints: any[];
  dimensions: any[];
  zoom: number;
  pan: { x: number; y: number };
}

export function safeParseEditorState(raw: string): EditorSaveState | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      metadata: {
        name: parsed.metadata?.name || 'Untitled Design',
        createdAt: parsed.metadata?.createdAt || new Date().toISOString(),
        updatedAt: parsed.metadata?.updatedAt || new Date().toISOString(),
        version: parsed.metadata?.version || '1.0',
        designType: parsed.metadata?.designType || 'general',
      },
      elements: Array.isArray(parsed.elements) ? parsed.elements : [],
      layers: Array.isArray(parsed.layers) ? parsed.layers : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
      zoom: typeof parsed.zoom === 'number' ? parsed.zoom : 1,
      pan: typeof parsed.pan === 'object' && parsed.pan !== null
        ? { x: parsed.pan.x ?? 0, y: parsed.pan.y ?? 0 }
        : { x: 0, y: 0 },
    };
  } catch (err) {
    console.error('safeParseEditorState failed:', err);
    return null;
  }
}

export function saveToLocalStorage(state: EditorSaveState): void {
  try {
    const payload: EditorSaveState = {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Save to localStorage failed:', err);
  }
}

export function loadFromLocalStorage(): EditorSaveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return safeParseEditorState(raw);
  } catch (err) {
    console.error('Load from localStorage failed:', err);
    return null;
  }
}

export function exportToJsonFile(state: EditorSaveState): void {
  try {
    const payload: EditorSaveState = {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.metadata.name.replace(/\s+/g, '_') || 'optiforge_design'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('JSON export failed:', err);
  }
}

export function importFromJsonFile(
  file: File,
  onSuccess: (state: EditorSaveState) => void,
  onError: (msg: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const raw = e.target?.result as string;
    if (!raw) { onError('Empty file'); return; }
    const parsed = safeParseEditorState(raw);
    if (!parsed) { onError('Invalid JSON format. Please use a valid OptiForge export file.'); return; }
    onSuccess(parsed);
  };
  reader.onerror = () => onError('Failed to read file');
  reader.readAsText(file);
}

export function useAutosave(
  getState: () => EditorSaveState,
  enabled: boolean = true
): void {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const state = getState();
      saveToLocalStorage(state);
      console.log('Autosaved at', new Date().toLocaleTimeString());
    }, 1000);
  }, [enabled, getState]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const state = getState();
      saveToLocalStorage(state);
    }, AUTOSAVE_INTERVAL);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, getState]);

  return triggerAutosave as any;
}
