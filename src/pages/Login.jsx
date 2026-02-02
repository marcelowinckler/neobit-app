import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { useEffect, useRef } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const googleBtnRef = useRef(null)
  const navigate = useNavigate()
  const { loginWithEmail, loginWithGoogle } = useChat()
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    let tries = 0
    const init = () => {
      if (window.google && clientId && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (resp) => {
              try {
                await loginWithGoogle(resp.credential)
                navigate('/home')
              } catch (e) {
                setError(e.message)
              }
            }
          })
          window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill' })
          window.google.accounts.id.prompt()
        } catch {}
        return
      }
      if (++tries < 50) setTimeout(init, 100)
    }
    init()
  }, [])

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        <div className="hidden lg:flex rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white"><path d="M12 3l8 4-8 4-8-4 8-4zM4 10l8 4 8-4v7l-8 4-8-4v-7z" stroke="currentColor" strokeWidth="1.5"/></svg>
              </div>
              <div className="text-xl font-semibold">MatrixBit AI Hub</div>
            </div>
            <div className="text-sm text-white/80">Converse com modelos de IA e organize seus chats em um só lugar.</div>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Acesso seguro com sessão</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Vários modelos disponíveis</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Histórico de conversas</li>
            </ul>
          </div>
        </div>
        <div className="w-full max-w-md mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6 border">
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-brand-600 text-white grid place-items-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 3l8 4-8 4-8-4 8-4zM4 10l8 4 8-4v7l-8 4-8-4v-7z" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <div className="text-sm font-semibold">MatrixBit AI Hub</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-semibold">Bem-vindo de volta</div>
            <div className="text-sm text-gray-600">Entre para acessar o MatrixBit</div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 6h16v12H4V6zm0 0l8 6 8-6" stroke="currentColor" strokeWidth="1.5"/></svg>
                </span>
                <input
                  type="email"
                  className="w-full border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm">Senha</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M6 10h12v10H6V10zm2 0V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.5"/></svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border rounded-md pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-900"
                >{showPassword ? 'Ocultar' : 'Mostrar'}</button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Lembrar sessão</span>
                </label>
                <button type="button" className="text-brand-600 hover:underline">Esqueci a senha</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 transition text-white rounded-md px-3 py-2 text-sm disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">ou</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div ref={googleBtnRef} />
          </div>
          <div className="text-sm text-center text-gray-600">
            Não tem conta? <Link to="/signup" className="text-brand-600 hover:underline">Cadastre-se</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
