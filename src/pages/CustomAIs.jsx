import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function CustomAIs() {
  const [ais, setAis] = useState([])
  const [error, setError] = useState('')
  const { createConversationWithAI, t } = useChat()
  const navigate = useNavigate()
  const getImgUrl = (u) => (u && u.startsWith('/uploads/')) ? `http://localhost:3001${u}` : u
  const [query, setQuery] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/ais/my', { credentials: 'include' })
        if (!res.ok) throw new Error('Falha ao carregar suas AIs')
        const data = await res.json()
        setAis(data.ais || [])
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">{t('my_ais')}</div>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
      <div className="max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M21 21l-5.2-5.2M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="1.5"/></svg>
          </span>
          <input
            className="w-full border dark:border-gray-800 rounded-md pl-10 pr-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
            placeholder="Buscar IA por nome ou descrição"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ais
          .filter(ai => {
            const q = String(query || '').toLowerCase()
            if (!q) return true
            const n = String(ai?.name || '').toLowerCase()
            const d = String(ai?.short_desc || '').toLowerCase()
            return n.includes(q) || d.includes(q)
          })
          .map(ai => (
          <div key={ai.id} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800">
              {ai.image_url ? (
                <img src={getImgUrl(ai.image_url)} alt={ai.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900" />
              )}
            </div>
            <div className="p-3 space-y-1">
              <div className="text-sm font-medium truncate">{ai.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{ai.short_desc}</div>
              <div className="pt-2 flex items-center gap-2">
                <button className="px-2.5 py-1.5 text-xs rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50" onClick={() => navigate(`/home/custom-ais/${ai.id}/edit`)}>{t('edit')}</button>
                <button className="px-2.5 py-1.5 text-xs rounded-md bg-brand-600 text-white" onClick={() => { createConversationWithAI(ai); navigate('/home/chats') }}>{t('open')}</button>
                <button className="ml-auto px-2.5 py-1.5 text-xs rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50" onClick={async () => {
                  try {
                    const res = await fetch(`/api/ais/${ai.id}`, { method: 'DELETE', credentials: 'include' })
                    if (!res.ok) throw new Error('Falha ao excluir AI')
                    setAis(prev => prev.filter(x => x.id !== ai.id))
                  } catch (e) {
                    setError(e.message)
                  }
                }}>{t('delete')}</button>
              </div>
            </div>
          </div>
        ))}
        {ais.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">Você ainda não criou nenhuma AI.</div>
        )}
      </div>
    </div>
  )
}
