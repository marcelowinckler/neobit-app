import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import MessageBubble from '../ui/MessageBubble'

export default function Share() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/shares/${id}`)
        if (!res.ok) throw new Error('Chat compartilhado não encontrado')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Carregando...</div>
  if (error) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>

  const { title, messages } = data.payload || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
           <div className="font-semibold text-lg">{title || 'Chat Compartilhado'}</div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400">
            Entrar
          </Link>
          <Link 
            to={`/home/chats?share=${id}`} 
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition shadow-sm hover:shadow"
          >
            Continuar essa conversa
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 lg:p-8">
        <div className="space-y-6">
          {messages?.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
        </div>
        <div className="h-20" />
      </main>
    </div>
  )
}
