import { useChat } from '../context/ChatContext'

export default function ConversationHistory() {
  const { conversations, currentConversationId, selectConversation } = useChat()
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-600">Histórico</div>
      <div className="flex gap-2 overflow-x-auto max-w-[60vw]">
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => selectConversation(c.id)}
            className={`px-3 py-1 rounded-full text-xs border ${
              currentConversationId === c.id ? 'bg-gray-100 border-gray-300' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>
    </div>
  )
}
