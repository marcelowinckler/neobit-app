import Sidebar from '../ui/Sidebar'
import ChatWindow from '../ui/ChatWindow'
import ChatInput from '../ui/ChatInput'
import ConversationHistory from '../ui/ConversationHistory'
import { useChat } from '../context/ChatContext'

export default function ChatLayout() {
  const { currentConversation, user, logout } = useChat()
  return (
    <div className="h-screen w-full bg-gray-50">
      <header className="h-14 border-b bg-white flex items-center px-4 justify-between">
        <div className="font-semibold">NeoBit AI Hub</div>
        <div className="flex items-center gap-4">
          <ConversationHistory />
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700">{user?.name || user?.email}</div>
            <button onClick={logout} className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50">Sair</button>
          </div>
        </div>
      </header>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <aside className="w-72 border-r bg-white">
          <Sidebar />
        </aside>
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ChatWindow />
          </div>
          <div className="border-t bg-white">
            <ChatInput disabled={!currentConversation} />
          </div>
        </main>
      </div>
    </div>
  )
}
