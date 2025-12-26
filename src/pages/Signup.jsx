import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signup } = useChat()
  const strength = password.length >= 10 ? 'forte' : password.length >= 6 ? 'média' : 'fraca'

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(email, password, name)
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
            <div className="text-sm text-white/80">Crie sua conta e comece a conversar com IA agora.</div>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Cadastro rápido</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Sessão segura</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white"/> Vários modelos de IA</li>
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
            <div className="text-2xl font-semibold">Criar conta</div>
            <div className="text-sm text-gray-600">Cadastre-se para usar o MatrixBit</div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm">Nome</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                placeholder="Seu nome"
              />
            </div>
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
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Crie uma senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-900"
                >{showPassword ? 'Ocultar' : 'Mostrar'}</button>
              </div>
              <div className="text-xs text-gray-500">Mínimo de 6 caracteres • Força da senha: {strength}</div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 transition text-white rounded-md px-3 py-2 text-sm disabled:opacity-50">
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
          <div className="text-sm text-center text-gray-600">
            Já tem conta? <Link to="/login" className="text-brand-600 hover:underline">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
