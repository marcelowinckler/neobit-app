import { useState } from 'react'
import Sidebar from '../ui/Sidebar'
import ChatWindow from '../ui/ChatWindow'
import ChatInput from '../ui/ChatInput'
import ConversationHistory from '../ui/ConversationHistory'
import { useChat } from '../context/ChatContext'

export default function ChatLayout() {
  const { currentConversation, user, logout } = useChat()
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      <header className="h-14 border-b bg-white flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="font-semibold">NeoBit AI Hub</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <ConversationHistory />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-700">{user?.name || user?.email}</div>
            <button onClick={logout} className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50">Sair</button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          absolute lg:static inset-y-0 left-0 z-30
          w-72 bg-white border-r transform transition-transform duration-200 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar onItemClick={() => setShowSidebar(false)} />
        </aside>

        <main className="flex-1 flex flex-col w-full bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 overflow-y-auto">
            <ChatWindow />
          </div>
          <div className="border-t bg-white dark:bg-gray-800 p-2 sm:p-4">
            <ChatInput disabled={!currentConversation} />
          </div>
        </main>
      </div>
    </div>
  )
}
