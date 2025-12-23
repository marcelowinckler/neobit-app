import Sidebar from '../ui/Sidebar'
import ChatWindow from '../ui/ChatWindow'
import ChatInput from '../ui/ChatInput'
import { useChat } from '../context/ChatContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Chats() {
  const { currentConversation, importConversation } = useChat()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const shareId = params.get('share')
    if (shareId) {
      ;(async () => {
        try {
          const res = await fetch(`/api/shares/${shareId}`, { credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            if (data?.payload) {
              importConversation(data.payload)
              const noShare = new URL(location.pathname, window.location.origin)
              navigate(noShare.pathname, { replace: true })
            }
          }
        } catch {}
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
        <Sidebar />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 flex flex-col h-[70vh]">
        <div className="h-12 border-b dark:border-gray-800 px-4 flex items-center justify-between">
          <div className="text-sm font-medium">{currentConversation?.title || 'Selecione um chat'}</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">Modelo: {currentConversation?.model}</div>
            {currentConversation && (
              <button
                className="text-xs px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
                onClick={async () => {
                  try {
                    const payload = {
                      title: currentConversation?.title,
                      model: currentConversation?.model,
                      aiId: currentConversation?.aiId || null,
                      messages: currentConversation?.messages || []
                    }
                    const r = await fetch('/api/shares', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(payload)
                    })
                    if (!r.ok) {
                      const err = await r.json().catch(() => ({}))
                      throw new Error(err.error || 'Falha ao compartilhar')
                    }
                    const data = await r.json()
                    const url = `${window.location.origin}/share/${data.id}`
                    await navigator.clipboard.writeText(url)
                    alert('Link copiado para a área de transferência!')
                  } catch (e) {
                    alert(e.message || 'Erro ao compartilhar')
                  }
                }}
              >
                Compartilhar
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <ChatWindow />
          </div>
          {currentConversation?.devUrl && (
            <aside className="w-[480px] border-l dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="h-10 px-3 border-b dark:border-gray-800 flex items-center justify-between text-xs">
                <div className="font-medium">Preview</div>
                <div className="flex items-center gap-2">
                  <a href={currentConversation.devUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20">Abrir em aba</a>
                  <button
                    className="px-2 py-1 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
                    onClick={async () => {
                      try {
                        const res = await fetch(currentConversation.devUrl, { credentials: 'include' })
                        const text = await res.text()
                        await navigator.clipboard.writeText(text)
                        alert('Código copiado para a área de transferência!')
                      } catch (e) {
                        alert('Falha ao copiar código')
                      }
                    }}
                  >
                    Copiar código
                  </button>
                </div>
              </div>
              <iframe src={currentConversation.devUrl} sandbox="allow-scripts allow-same-origin" className="w-full h-[calc(70vh-2.5rem)]" />
            </aside>
          )}
        </div>
        <div className="border-t dark:border-gray-800">
          <ChatInput disabled={!currentConversation} />
        </div>
      </div>
    </div>
  )
}
