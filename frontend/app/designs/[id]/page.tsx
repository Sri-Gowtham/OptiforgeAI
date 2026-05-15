'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { designAPI } from '@/lib/api'
import { buildArchitecturalImage } from '@/lib/buildArchitecturalImage'
import Sidebar from '@/components/Sidebar'
import { FileText, Edit3, ChevronLeft, Boxes, AlertTriangle } from 'lucide-react'

function ArchitecturalPreview({ url: initialUrl, prompt }: { url: string; prompt: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const startTime = useRef(Date.now());
  const maxRetries = 3;

  useEffect(() => {
    console.log('[ARCH IMG INIT]', { url: url.slice(0, 50) + '...', retryCount });
    startTime.current = Date.now();
    setLoading(true);
    setError(false);
  }, [url, retryCount]);

  const handleLoad = () => {
    const duration = Date.now() - startTime.current;
    console.log('[ARCH IMG LOADED]', { duration: `${duration}ms`, retryCount });
    setLoading(false);
  };

  const handleError = () => {
    if (retryCount < maxRetries) {
      const nextRetry = retryCount + 1;
      const newUrl = `${buildArchitecturalImage(prompt)}&retry=${Date.now()}`;
      console.log('[ARCH IMG RETRY]', { count: nextRetry, newUrl: newUrl.slice(0, 50) + '...' });
      setRetryCount(nextRetry);
      setUrl(newUrl);
    } else {
      console.error('[ARCH IMG FAILED]', { finalRetryCount: retryCount });
      setLoading(false);
      setError(true);
    }
  };

  return (
    <div className="relative w-full min-h-[420px] aspect-video overflow-hidden rounded-2xl bg-gray-900 shadow-2xl border border-white/5"
         style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-indigo-400 font-mono text-[10px] animate-pulse uppercase tracking-widest">Rendering Visualization...</p>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900/90 backdrop-blur-md border border-red-500/20">
          <AlertTriangle size={32} className="text-red-500 mb-4" />
          <h4 className="text-white font-bold mb-2">Preview generation failed</h4>
          <p className="text-white/50 text-sm max-w-xs mb-6">
            The architectural specification was generated successfully.
          </p>
          <button 
            onClick={() => { 
              setRetryCount(0); 
              setUrl(`${buildArchitecturalImage(prompt)}&refresh=${Date.now()}`); 
            }}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all"
          >
            Retry Rendering
          </button>
        </div>
      ) : (
        <img
          src={url}
          alt="Design Preview"
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-contain transition-all duration-700 ${
            loading ? 'scale-105 blur-lg opacity-0' : 'scale-100 blur-0 opacity-100'
          }`}
        />
      )}
    </div>
  );
}

export default function DesignIdPage() {
  const router = useRouter()
  const { id } = useParams()
  const [design, setDesign] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      console.log('[AI LOAD] Fetching design detail:', id);
      designAPI.getById(id as string)
        .then(data => {
          console.log('[AI LOAD] Design loaded:', data);
          setDesign(data);
        })
        .catch(err => {
          console.error('[AI LOAD] Failed:', err);
          toast.error('Failed to load design');
          router.replace('/designs');
        })
        .finally(() => setLoading(false));
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 animate-pulse">Loading design data...</p>
      </div>
    )
  }

  if (!design) return null;

  const imageUrl = design.imageUrl || design.data?.imageUrl || design.metadata?.imageUrl;
  console.log('[PERSISTENCE] Resolved imageUrl for preview:', imageUrl);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => router.push('/designs')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{design.name}</h1>
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded border border-purple-500/20 uppercase">
                {design.sourceType || 'AI'} DESIGN
              </span>
            </div>
            <p className="text-gray-400 text-sm">Created on {new Date(design.createdAt).toLocaleDateString()}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Section */}
            {imageUrl ? (
              <ArchitecturalPreview url={imageUrl} prompt={design.name} />
            ) : (
              <div className="aspect-video bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center text-gray-600">
                <Boxes size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Design Blueprint Preview</p>
                {design.data?.elements?.length > 0 && (
                  <p className="text-xs mt-2 text-indigo-400/60">{design.data.elements.length} CAD elements found</p>
                )}
              </div>
            )}

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                Project Details
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                This is an AI-generated design result. You can view the specifications below or open it in the CAD editor to modify the geometry.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-2xl p-6">
              <h3 className="font-bold mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/editor?id=${design.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Edit3 size={18} /> Open in CAD Editor
                </button>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Diagnostics</h4>
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="text-indigo-400">{design.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Source:</span>
                  <span className="text-emerald-400">{design.sourceType || 'unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Elements:</span>
                  <span className="text-amber-400">{design.data?.elements?.length || 0}</span>
                </div>
                {imageUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Has Image:</span>
                    <span className="text-emerald-400">YES</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
