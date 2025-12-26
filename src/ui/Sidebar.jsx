import { useState } from 'react'
import { useChat } from '../context/ChatContext'

export default function Sidebar({ onItemClick }) {
  const { conversations, currentConversationId, selectConversation, createConversation, renameConversation, deleteConversation, t } = useChat()
  const [editingId, setEditingId] = useState(null)
  const [tempTitle, setTempTitle] = useState('')

  const handleSelect = (id) => {
    selectConversation(id)
    if (onItemClick) onItemClick()
  }

  const handleCreate = () => {
    createConversation()
    if (onItemClick) onItemClick()
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-3">
        <button
          className="w-full bg-brand-600 dark:bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
          onClick={handleCreate}
        >
          {t('new_chat')}
        </button>
      </div>
      <div className="px-3 text-xs font-medium text-gray-500">{t('chats')}</div>
      <ul className="p-2 space-y-1 overflow-y-auto flex-1">
        {conversations.map((c, idx) => (
          <li key={c.id}>
            {editingId === c.id ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  className="flex-1 rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  autoFocus
                />
                <button
                  className="text-xs px-2 py-1 rounded-md border bg-white dark:bg-gray-800 dark:text-white hover:bg-gray-50"
                  onClick={() => {
                    renameConversation(c.id, tempTitle || c.title || `Chat ${idx + 1}`)
                    setEditingId(null)
                    setTempTitle('')
                  }}
                >Salvar</button>
              </div>
            ) : (
              <div className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm group ${
                currentConversationId === c.id ? 'bg-gray-100 dark:bg-gray-800 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
                <button className="flex-1 text-left truncate dark:text-gray-200" onClick={() => handleSelect(c.id)}>
                  {c.title || `Chat ${idx + 1}`}
                </button>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    className="text-xs p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(c.id)
                      setTempTitle(c.title || `Chat ${idx + 1}`)
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button
                    className="text-xs p-1 rounded hover:bg-red-100 text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(c.id)
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="p-3 text-xs text-gray-400 border-t dark:border-gray-800">Crie e gerencie seus chats</div>
    </div>
  )
}
