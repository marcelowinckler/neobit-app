import { useChat } from '../context/ChatContext'
import { useState, useEffect } from 'react'

export default function Admin() {
  const { user, t } = useChat()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [error, setError] = useState('')

  // Buscar usuários do sistema
  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setError('')
      } else {
        let msg = 'Falha ao buscar usuários'
        const status = response.status
        const err = await response.json().catch(() => ({}))
        if (status === 401) msg = 'Não autenticado'
        else if (status === 403) msg = 'Acesso negado. Apenas administradores.'
        else msg = err.error || msg
        setError(msg)
      }
    } catch (error) {
      setError('Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }

  function openModal(action, user) {
    setModalAction(action)
    setSelectedUser(user)
    setShowModal(true)
  }

  async function handleDeleteUser() {
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== selectedUser.id))
        setShowModal(false)
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
    }
  }

  async function handleBlockUser() {
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/block`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        fetchUsers() // Recarregar lista
        setShowModal(false)
      }
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error)
    }
  }

  async function handleChangePlan(newPlan) {
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/plan`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      })
      
      if (response.ok) {
        fetchUsers() // Recarregar lista
        setShowModal(false)
      }
    } catch (error) {
      console.error('Erro ao mudar plano:', error)
    }
  }

  function getPlanExpiryDate(plan) {
    const now = new Date()
    switch (plan) {
      case 'Semanal':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'Mensal':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      case 'Semestral':
        return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
      case 'Anual':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      case 'Lifetime':
        return null // Nunca expira
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000) // Free - 1 dia
    }
  }

  function formatDate(date) {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  function getStatus(user) {
    if (user.is_blocked) return 'Bloqueado'
    if (!user.subscription_end) return 'Free'
    return new Date(user.subscription_end) > new Date() ? 'Pay' : 'Free'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando usuários...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Painel de Administração</div>
        <div className="text-sm text-gray-500">
          Total de usuários: {users.length}
        </div>
      </div>
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Nome de Usuário
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  IP
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Plano
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  IAs Criadas
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Chats Criados
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Mensagens Enviadas
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name || 'Não informado'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.last_login_ip || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {user.plan || 'Free'}
                    </div>
                    {user.subscription_end && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Expira: {formatDate(user.subscription_end)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatus(user) === 'Bloqueado' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : getStatus(user) === 'Pay'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {getStatus(user)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {user.ai_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {user.chat_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {user.message_count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal('plan', user)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Plano
                      </button>
                      <button
                        onClick={() => openModal('block', user)}
                        className={`text-sm font-medium ${
                          user.is_blocked 
                            ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                            : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                        }`}
                      >
                        {user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                      <button
                        onClick={() => openModal('delete', user)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border dark:border-gray-800">
            <div className="text-lg font-semibold mb-4">
              {modalAction === 'delete' && 'Confirmar Exclusão'}
              {modalAction === 'block' && `${selectedUser?.is_blocked ? 'Desbloquear' : 'Bloquear'} Usuário`}
              {modalAction === 'plan' && 'Mudar Plano'}
            </div>
            
            <div className="mb-6">
              {modalAction === 'delete' && (
                <p className="text-gray-600 dark:text-gray-400">
                  Tem certeza que deseja excluir permanentemente o usuário <strong>{selectedUser?.email}</strong>? 
                  Esta ação não pode ser desfeita e removerá todas as IAs, chats e mensagens do usuário.
                </p>
              )}
              {modalAction === 'block' && (
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedUser?.is_blocked 
                    ? `Tem certeza que deseja desbloquear o usuário ${selectedUser?.email}?`
                    : `Tem certeza que deseja bloquear o usuário ${selectedUser?.email}? O usuário não poderá acessar o sistema.`
                  }
                </p>
              )}
              {modalAction === 'plan' && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Selecione o novo plano para <strong>{selectedUser?.email}</strong>:
                  </p>
                  <div className="space-y-2">
                    {['Free', 'Semanal', 'Mensal', 'Semestral', 'Anual', 'Lifetime'].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => handleChangePlan(plan)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          selectedUser?.plan === plan
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <div className="font-medium">{plan}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {plan === 'Free' && 'Acesso básico por 1 dia'}
                          {plan === 'Semanal' && 'Acesso premium por 7 dias'}
                          {plan === 'Mensal' && 'Acesso premium por 30 dias'}
                          {plan === 'Semestral' && 'Acesso premium por 180 dias'}
                          {plan === 'Anual' && 'Acesso premium por 365 dias'}
                          {plan === 'Lifetime' && 'Acesso premium vitalício'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              {modalAction !== 'plan' && (
                <button
                  onClick={() => {
                    if (modalAction === 'delete') handleDeleteUser()
                    if (modalAction === 'block') handleBlockUser()
                  }}
                  className={`px-4 py-2 text-sm rounded-md text-white ${
                    modalAction === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {modalAction === 'delete' ? 'Excluir' : selectedUser?.is_blocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
