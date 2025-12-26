import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import SubscriptionModal from '../ui/SubscriptionModal'

function SidebarLink({ to, label, icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
          isActive ? 'bg-gray-100 dark:bg-gray-800 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`
      }
    >
      <span className="h-5 w-5 text-gray-600 dark:text-gray-400">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppShell() {
  const { user, logout, t } = useChat()
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="h-screen w-full bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="h-14 border-b bg-white/80 dark:bg-gray-900/60 backdrop-blur flex items-center justify-between px-4 shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <button 
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <NavLink to="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand-600 dark:bg-gray-700 text-white grid place-items-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M12 3l8 4-8 4-8-4 8-4zM4 10l8 4 8-4v7l-8 4-8-4v-7z" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">MatrixBit</div>
          </NavLink>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-sm text-gray-700 dark:text-gray-200">{user?.name || user?.email}</div>
          <button onClick={logout} className="text-sm px-3 py-1 rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50">Sair</button>
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

        <aside className={`
          absolute lg:static inset-y-0 left-0 z-30
          w-72 border-r bg-white/80 dark:bg-gray-900/95 backdrop-blur p-3 space-y-2
          transform transition-transform duration-200 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <SidebarLink onClick={() => setShowSidebar(false)} to="/home" label={t('home')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M3 11l9-8 9 8v9H3v-9z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink onClick={() => setShowSidebar(false)} to="/home/chats" label={t('chats')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 6h16v8H7l-3 3V6z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink onClick={() => setShowSidebar(false)} to="/home/custom-ais" label={t('my_ais')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 2l4 4-4 4-4-4 4-4zm0 8l4 4-4 4-4-4 4-4z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink onClick={() => setShowSidebar(false)} to="/home/marketplace" label={t('marketplace')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M3 7h18l-2 10H5L3 7zm5 13a2 2 0 104 0H8z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink onClick={() => setShowSidebar(false)} to="/home/create-ai" label={t('create_ai')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink onClick={() => setShowSidebar(false)} to="/home/plans" label={t('plans')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 7h16v12H4V7zm2-2h12v2H6V5z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink onClick={() => setShowSidebar(false)} to="/home/settings" label={t('settings')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2m12 0h2M6.5 6.5l1.4 1.4m8.2 8.2l1.4 1.4M6.5 17.5l1.4-1.4m8.2-8.2l1.4-1.4" stroke="currentColor" strokeWidth="1.5"/></svg>} />
        </aside>
        
        <main className="flex-1 overflow-y-auto bg-transparent w-full">
          <div className="p-4 sm:p-6 text-gray-900 dark:text-gray-100">
            <Outlet />
          </div>
        </main>
      </div>
      <SubscriptionModal />
    </div>
  )
}
