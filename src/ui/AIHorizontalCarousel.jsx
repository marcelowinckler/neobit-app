import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function AIHorizontalCarousel() {
  const [publicAIs, setPublicAIs] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const navigate = useNavigate()
  const { createConversationWithAI } = useChat()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/ais/public', { credentials: 'include' })
        if (!res.ok) throw new Error('Falha ao carregar IAs públicas')
        const data = await res.json()
        setPublicAIs(data.ais || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const scroll = (dir) => {
    if (!scrollRef.current) return
    const scrollAmount = 280
    scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' })
  }

  const handleClick = (ai) => {
    createConversationWithAI(ai)
    navigate('/home/chats')
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-lg font-semibold mb-4">IAs populares</div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 h-36 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (publicAIs.length === 0) return null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">IAs populares</div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="p-2 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => scroll(1)} className="p-2 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
        {publicAIs.map((ai) => (
          <div
            key={ai.id}
            onClick={() => handleClick(ai)}
            className="flex-shrink-0 w-64 h-36 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div>
              {ai.image_url && (
                <img src={ai.image_url.startsWith('/uploads/') ? `http://localhost:3001${ai.image_url}` : ai.image_url} alt={ai.name} className="w-10 h-10 rounded-xl object-cover mb-2" />
              )}
              <div className="font-semibold text-sm">{ai.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{ai.short_desc}</div>
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-400">Começar chat →</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}