'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { designAPI } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import { FileText, Edit3, ChevronLeft, Boxes } from 'lucide-react'

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
            {/* Preview Placeholder */}
            <div className="aspect-video bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center text-gray-600">
              <Boxes size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Design Blueprint Preview</p>
              {design.data?.elements?.length > 0 && (
                <p className="text-xs mt-2 text-indigo-400/60">{design.data.elements.length} CAD elements found</p>
              )}
            </div>

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
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
