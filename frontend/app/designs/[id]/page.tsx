'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Designs Redirect Page
 * Handles legacy or direct links to /designs/[id] by redirecting to the editor.
 */
export default function DesignIdPage() {
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    if (id) {
      console.log(`[DesignsRedirect] Redirecting design ${id} to editor...`)
      router.replace(`/editor?id=${id}`)
    } else {
      toast.error('Invalid design ID')
      router.replace('/dashboard')
    }
  }, [id, router])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white p-4">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-bold mb-2">Loading Design</h2>
      <p className="text-gray-400 text-sm animate-pulse">Initializing CAD environment...</p>
      
      <div className="mt-12 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl max-w-md w-full">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Diagnostics</h3>
        <div className="space-y-2 font-mono text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Target ID:</span>
            <span className="text-indigo-400">{id || 'undefined'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Route:</span>
            <span className="text-emerald-400">/designs/[id]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Action:</span>
            <span className="text-amber-400">Redirecting to /editor?id={id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
