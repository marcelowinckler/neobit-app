import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function CustomAIs() {
  const [ais, setAis] = useState([])
  const [error, setError] = useState('')
  const { createConversationWithAI, t } = useChat()
  const navigate = useNavigate()

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ais.map(ai => (
          <div key={ai.id} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-4">
            {ai.image_url && <img src={ai.image_url.startsWith('/uploads/') ? `http://localhost:3001${ai.image_url}` : ai.image_url} alt={ai.name} className="h-20 w-full object-cover rounded-xl" />}
            <div className="text-sm font-medium">{ai.name}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{ai.short_desc}</div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 text-sm rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50" onClick={() => navigate(`/home/custom-ais/${ai.id}/edit`)}>{t('edit')}</button>
              <button className="px-3 py-2 text-sm rounded-md bg-brand-600 text-white" onClick={() => { createConversationWithAI(ai); navigate('/home/chats') }}>{t('open')}</button>
              <button className="px-3 py-2 text-sm rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50" onClick={async () => {
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
        ))}
        {ais.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">Você ainda não criou nenhuma AI.</div>
        )}
      </div>
    </div>
  )
}
