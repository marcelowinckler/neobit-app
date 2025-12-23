import { useState } from 'react'
import { useChat } from '../context/ChatContext'

export default function Sidebar() {
  const { conversations, currentConversationId, selectConversation, createConversation, renameConversation, deleteConversation, t } = useChat()
  const [editingId, setEditingId] = useState(null)
  const [tempTitle, setTempTitle] = useState('')
  return (
    <div className="h-full flex flex-col">
      <div className="p-3">
        <button
          className="w-full bg-brand-600 text-white rounded-md px-3 py-2 text-sm"
          onClick={() => createConversation()}
        >
          {t('new_chat')}
        </button>
      </div>
      <div className="px-3 text-xs font-medium text-gray-500">{t('chats')}</div>
      <ul className="p-2 space-y-1">
        {conversations.map((c, idx) => (
          <li key={c.id}>
            {editingId === c.id ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  className="flex-1 rounded-md border px-2 py-1 text-sm"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  autoFocus
                />
                <button
                  className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
                  onClick={() => {
                    renameConversation(c.id, tempTitle || c.title || `Chat ${idx + 1}`)
                    setEditingId(null)
                    setTempTitle('')
                  }}
                >Salvar</button>
              </div>
            ) : (
              <div className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                currentConversationId === c.id ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
              }`}>
                <button className="flex-1 text-left" onClick={() => selectConversation(c.id)}>
                  {c.title || `Chat ${idx + 1}`}
                </button>
                <button
                  className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
                  onClick={() => {
                    setEditingId(c.id)
                    setTempTitle(c.title || `Chat ${idx + 1}`)
                  }}
                >{t('rename')}</button>
                <button
                  className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
                  onClick={() => {
                    deleteConversation(c.id)
                  }}
                >{t('delete')}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-auto p-3 text-xs text-gray-400">Crie e gerencie seus chats</div>
    </div>
  )
}
