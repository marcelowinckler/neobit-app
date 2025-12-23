import { NavLink, Outlet } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import SubscriptionModal from '../ui/SubscriptionModal'

function SidebarLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
          isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
        }`
      }
    >
      <span className="h-5 w-5 text-gray-600">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppShell() {
  const { user, logout, t } = useChat()
  return (
    <div className="h-screen w-full bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <header className="h-14 border-b bg-white/80 dark:bg-gray-900/60 backdrop-blur flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <NavLink to="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand-600 text-white grid place-items-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M12 3l8 4-8 4-8-4 8-4zM4 10l8 4 8-4v7l-8 4-8-4v-7z" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">NeoBit</div>
          </NavLink>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-200">{user?.name || user?.email}</div>
          <button onClick={logout} className="text-sm px-3 py-1 rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50">Sair</button>
        </div>
      </header>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <aside className="w-72 border-r bg-white/80 dark:bg-gray-900/60 backdrop-blur p-3 space-y-2">
          <SidebarLink to="/home" label={t('home')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M3 11l9-8 9 8v9H3v-9z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink to="/home/chats" label={t('chats')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 6h16v8H7l-3 3V6z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink to="/home/custom-ais" label={t('my_ais')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 2l4 4-4 4-4-4 4-4zm0 8l4 4-4 4-4-4 4-4z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink to="/home/marketplace" label={t('marketplace')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M3 7h18l-2 10H5L3 7zm5 13a2 2 0 104 0H8z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink to="/home/create-ai" label={t('create_ai')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink to="/home/plans" label={t('plans')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 7h16v12H4V7zm2-2h12v2H6V5z" stroke="currentColor" strokeWidth="1.5"/></svg>} />
          <SidebarLink to="/home/settings" label={t('settings')} icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2m12 0h2M6.5 6.5l1.4 1.4m8.2 8.2l1.4 1.4M6.5 17.5l1.4-1.4m8.2-8.2l1.4-1.4" stroke="currentColor" strokeWidth="1.5"/></svg>} />
        </aside>
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6 text-gray-900 dark:text-gray-100">
            <Outlet />
          </div>
        </main>
      </div>
      <SubscriptionModal />
    </div>
  )
}
