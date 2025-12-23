import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function Marketplace() {
  const [ais, setAis] = useState([])
  const [error, setError] = useState('')
  const { createConversationWithAI, t } = useChat()
  const navigate = useNavigate()

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

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">{t('marketplace')}</div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ais.map(ai => (
          <div key={ai.id} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-4">
            {ai.image_url ? (
              <img src={ai.image_url.startsWith('/uploads/') ? `http://localhost:3001${ai.image_url}` : ai.image_url} alt={ai.name} className="h-24 w-full object-cover rounded-xl" />
            ) : (
              <div className="h-24 rounded-xl bg-gradient-to-br from-brand-200 to-brand-400" />
            )}
            <div className="mt-3 text-sm font-medium">{ai.name}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{ai.short_desc} - {ai.model}</div>
            <button className="mt-3 px-3 py-2 text-sm rounded-md bg-brand-600 text-white" onClick={() => { createConversationWithAI(ai); navigate('/home/chats') }}>{t('use_ai')}</button>
          </div>
        ))}
        {ais.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">Nenhuma AI pública disponível ainda.</div>
        )}
      </div>
    </div>
  )
}
