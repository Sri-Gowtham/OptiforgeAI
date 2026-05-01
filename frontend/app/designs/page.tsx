'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { designAPI } from '@/lib/api'
import { FileText, Clock, ExternalLink, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function DesignsPage() {
  const router = useRouter()
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    designAPI.getAll()
      .then(setDesigns)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Saved Designs</h1>
            <p className="text-gray-400">Manage and reload your parametric CAD models.</p>
          </div>
          <button 
            onClick={() => router.push('/editor')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-all"
          >
            Create New
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : designs.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-20 text-center">
            <FileText className="mx-auto mb-4 text-gray-600" size={48} />
            <h3 className="text-xl font-bold mb-2">No designs found</h3>
            <p className="text-gray-400 mb-6">You haven't saved any CAD models yet.</p>
            <button 
              onClick={() => router.push('/editor')}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Start designing →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div 
                key={design.id}
                className="bg-[#13131f] border border-white/[0.06] rounded-xl p-6 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-indigo-600/10 rounded-lg text-indigo-400">
                    <FileText size={20} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                    <Clock size={10} />
                    {format(new Date(design.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-1 truncate">{design.name}</h3>
                <p className="text-xs text-gray-500 mb-6">
                  {design.data.elements.length} elements · {design.data.constraints.length} constraints
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/editor?id=${design.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.05] hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    <ExternalLink size={14} /> Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
