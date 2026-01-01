import { useEffect, useState } from 'react'
import { useChat } from '../context/ChatContext'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [plans, setPlans] = useState({})
  const { user } = useChat()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        if (res.status === 403) throw new Error('Acesso negado')
        throw new Error('Erro ao carregar usuários')
      }
      const data = await res.json()
      const list = data.users || []
      setUsers(list)
      const initialPlans = {}
      for (const u of list) initialPlans[u.id] = (u.plan || 'free')
      setPlans(initialPlans)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const updatePlan = async (id) => {
    try {
      setUpdating(id)
      const plan = plans[id]
      const res = await fetch(`/api/admin/users/${id}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Falha ao atualizar plano')
      }
      await fetchUsers()
    } catch (e) {
      alert(e.message)
    } finally {
      setUpdating(null)
    }
  }

  const deleteUser = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) return
    try {
      setDeleting(id)
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Falha ao excluir usuário')
      }
      await fetchUsers()
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <div className="p-8 text-center dark:text-gray-300">Carregando painel...</div>
  if (error) return <div className="p-8 text-center text-red-500">Erro: {error}</div>

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
            <p className="text-gray-500 dark:text-gray-400">Visão geral dos usuários e métricas</p>
          </div>
          <div className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Total Usuários: {users.length}
          </div>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Cadastro</th>
                  <th className="px-6 py-4 text-center">AIs Criadas</th>
                  <th className="px-6 py-4 text-center">Plano</th>
                  <th className="px-6 py-4 text-center">Conversas</th>
                  <th className="px-6 py-4">Ações</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{u.name || 'Sem nome'}</div>
                      <div className="text-xs text-gray-500">ID: {u.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {new Date(u.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {u.ai_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <select
                          value={plans[u.id] || 'free'}
                          onChange={e => setPlans(prev => ({ ...prev, [u.id]: e.target.value }))}
                          className="border rounded-md text-xs px-2 py-1 dark:bg-gray-800 dark:text-gray-200"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 text-xs">
                      {u.conversation_count || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updatePlan(u.id)}
                          disabled={updating === u.id}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded disabled:opacity-50"
                        >
                          {updating === u.id ? 'Salvando...' : 'Salvar Plano'}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={deleting === u.id || u.email === 'matrixbit@gmail.com'}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-50"
                          title={u.email === 'matrixbit@gmail.com' ? 'Admin não pode ser excluído' : ''}
                        >
                          {deleting === u.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}