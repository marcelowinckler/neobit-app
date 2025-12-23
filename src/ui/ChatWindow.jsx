import { useEffect, useRef } from 'react'
import { useChat } from '../context/ChatContext'
import MessageBubble from './MessageBubble'

export default function ChatWindow() {
  const { currentConversation, isWorking } = useChat()
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [currentConversation?.messages.length])

  return (
    <div ref={ref} className="h-full overflow-y-auto p-6">
      {!currentConversation && (
        <div className="h-full grid place-items-center">
          <div className="text-center">
            <div className="text-2xl font-semibold">Bem-vindo</div>
            <div className="text-gray-600 dark:text-gray-400">Selecione um modelo e clique em Novo chat</div>
          </div>
        </div>
      )}
      {currentConversation && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {currentConversation.messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {isWorking && (
            <div className="flex justify-start">
              <div className="max-w-xl rounded-2xl px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
