'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportToJsonFile,
  importFromJsonFile,
  EditorSaveState,
} from '@/lib/editorPersistence';

interface EditorSaveBarProps {
  getState: () => EditorSaveState;
  onLoad: (state: EditorSaveState) => void;
  designName?: string;
  onNameChange?: (name: string) => void;
}

export default function EditorSaveBar({
  getState,
  onLoad,
  designName = 'Untitled Design',
  onNameChange,
}: EditorSaveBarProps) {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(designName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = useCallback(() => {
    const state = getState();
    saveToLocalStorage(state);
    const time = new Date().toLocaleTimeString();
    setLastSaved(time);
    showToast(`Design saved at ${time}`);
  }, [getState]);

  const handleLoad = useCallback(() => {
    const state = loadFromLocalStorage();
    if (!state) { showToast('No saved design found', 'error'); return; }
    onLoad(state);
    showToast(`Loaded: ${state.metadata.name}`);
  }, [onLoad]);

  const handleExportJson = useCallback(() => {
    const state = getState();
    exportToJsonFile(state);
    showToast('JSON exported');
  }, [getState]);

  const handleImportJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importFromJsonFile(
      file,
      (state) => { onLoad(state); showToast(`Imported: ${state.metadata.name}`); },
      (err) => showToast(err, 'error')
    );
    e.target.value = '';
  }, [onLoad]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
    fontWeight: 500, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)', color: '#e2e8f0',
    transition: 'background 0.15s',
  };

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 8px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {editingName ? (
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={() => { setEditingName(false); onNameChange?.(nameInput); }}
            onKeyDown={e => { if (e.key === 'Enter') { setEditingName(false); onNameChange?.(nameInput); } }}
            autoFocus
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #6366f1', borderRadius: '4px', color: 'white', fontSize: '12px', padding: '2px 6px', width: '140px', outline: 'none' }}
          />
        ) : (
          <span
            onClick={() => setEditingName(true)}
            title="Click to rename"
            style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {designName}
          </span>
        )}

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

        <button style={btnStyle} onClick={handleSave} title="Save (Ctrl+S)">
          💾 Save
        </button>
        <button style={btnStyle} onClick={handleLoad} title="Load last save">
          📂 Load
        </button>
        <button style={btnStyle} onClick={handleExportJson} title="Export as JSON">
          ⬇ Export
        </button>
        <button style={btnStyle} onClick={handleImportJson} title="Import JSON file">
          ⬆ Import
        </button>

        {lastSaved && (
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            Last saved {lastSaved}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '24px', zIndex: 99999,
          padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          background: toast.type === 'success' ? '#166534' : '#7f1d1d',
          border: `1px solid ${toast.type === 'success' ? '#16a34a' : '#dc2626'}`,
          color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </>
  );
}
