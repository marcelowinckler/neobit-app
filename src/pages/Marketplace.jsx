import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function Marketplace() {
  const [ais, setAis] = useState([])
  const [error, setError] = useState('')
  const { createConversationWithAI, t } = useChat()
  const navigate = useNavigate()
  const rowRefs = [useRef(null), useRef(null), useRef(null)]
  const [query, setQuery] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/ais/public', { credentials: 'include' })
        if (!res.ok) throw new Error('Falha ao carregar Marketplace')
        const data = await res.json()
        setAis(data.ais || [])
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [])

  const getImgUrl = (u) => {
    if (!u) return ''
    if (u.startsWith('/uploads/')) return `http://localhost:3001${u}`
    return u
  }

  const scrollRow = (idx, dir) => {
    const ref = rowRefs[idx]?.current
    if (!ref) return
    const amount = 320
    ref.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  const normalizedQuery = String(query || '').toLowerCase()
  const filtered = normalizedQuery
    ? ais.filter(ai => {
        const n = String(ai?.name || '').toLowerCase()
        const d = String(ai?.short_desc || '').toLowerCase()
        const m = String(ai?.model || '').toLowerCase()
        return n.includes(normalizedQuery) || d.includes(normalizedQuery) || m.includes(normalizedQuery)
      })
    : ais

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">{t('marketplace')}</div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
      <div className="max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M21 21l-5.2-5.2M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="1.5"/></svg>
          </span>
          <input
            className="w-full border dark:border-gray-800 rounded-md pl-10 pr-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
            placeholder="Buscar IA por nome, descrição ou modelo"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>
      {filtered.length === 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">Nenhuma AI pública disponível ainda.</div>
      )}
      {filtered.length > 0 && (
        <div className="space-y-8">
          <SectionRow
            title="Populares"
            items={filtered.slice(0, 12)}
            onScrollLeft={() => scrollRow(0, -1)}
            onScrollRight={() => scrollRow(0, 1)}
            refEl={rowRefs[0]}
            onOpen={(ai) => { createConversationWithAI(ai); navigate('/home/chats') }}
            getImgUrl={getImgUrl}
          />
          <SectionRow
            title="Novidades"
            items={[...filtered].reverse().slice(0, 12)}
            onScrollLeft={() => scrollRow(1, -1)}
            onScrollRight={() => scrollRow(1, 1)}
            refEl={rowRefs[1]}
            onOpen={(ai) => { createConversationWithAI(ai); navigate('/home/chats') }}
            getImgUrl={getImgUrl}
          />
          <SectionRow
            title="Recomendadas"
            items={shuffle(filtered).slice(0, 12)}
            onScrollLeft={() => scrollRow(2, -1)}
            onScrollRight={() => scrollRow(2, 1)}
            refEl={rowRefs[2]}
            onOpen={(ai) => { createConversationWithAI(ai); navigate('/home/chats') }}
            getImgUrl={getImgUrl}
          />
        </div>
      )}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function SectionRow({ title, items, onScrollLeft, onScrollRight, refEl, onOpen, getImgUrl }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">{title}</div>
        <div className="flex gap-2">
          <button onClick={onScrollLeft} className="p-2 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={onScrollRight} className="p-2 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div ref={refEl} className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {items.map(ai => (
          <div
            key={ai.id}
            onClick={() => onOpen(ai)}
            className="relative flex-shrink-0 w-52 md:w-64 h-32 md:h-36 rounded-xl overflow-hidden cursor-pointer group"
          >
            {ai.image_url ? (
              <img src={getImgUrl(ai.image_url)} alt={ai.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition" />
            <div className="absolute bottom-2 left-2 right-2">
              <div className="text-xs md:text-sm font-semibold text-white truncate">{ai.name}</div>
              <div className="text-[10px] md:text-xs text-white/80 truncate">{ai.short_desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
