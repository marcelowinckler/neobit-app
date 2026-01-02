import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AppShell from './layout/AppShell'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Chats from './pages/Chats'
import Marketplace from './pages/Marketplace'
import CustomAIs from './pages/CustomAIs'
import CreateAI from './pages/CreateAI'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import EditAI from './pages/EditAI'
import Share from './pages/Share'
import AdminDashboard from './pages/AdminDashboard'
import { ChatProvider, useChat } from './context/ChatContext'

function ProtectedRoute({ children }) {
  const { user, authReady } = useChat()
  if (!authReady && !user) return <div />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ChatProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share/:id" element={<Share />} />
        <Route path="/" element={<Landing />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="chats" element={<Chats />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="custom-ais" element={<CustomAIs />} />
          <Route path="custom-ais/:id/edit" element={<EditAI />} />
          <Route path="create-ai" element={<CreateAI />} />
          <Route path="plans" element={<Plans />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ChatProvider>
  )
}
