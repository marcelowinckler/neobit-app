import { useEffect, useMemo, useState } from 'react'
import { useChat } from '../context/ChatContext'

export default function Home() {
  const { conversations, models, user } = useChat()
  const [myAIs, setMyAIs] = useState([])
  const [loadingAIs, setLoadingAIs] = useState(true)
  const [errorAIs, setErrorAIs] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/ais/my', { credentials: 'include' })
        if (!res.ok) throw new Error('Falha ao carregar suas AIs')
        const data = await res.json()
        setMyAIs(data.ais || [])
      } catch (e) {
        setErrorAIs(e.message)
      } finally {
        setLoadingAIs(false)
      }
    })()
  }, [])

  const modelUsage = useMemo(() => {
    const counts = new Map()
    for (const c of conversations) {
      const m = c.model || models[0]?.id || 'gpt-4o-mini'
      counts.set(m, (counts.get(m) || 0) + 1)
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1
    return Array.from(counts.entries()).map(([id, count]) => {
      const name = models.find(mm => mm.id === id)?.name || id
      return { id, name, pct: Math.round((count / total) * 100) }
    }).sort((a, b) => b.pct - a.pct)
  }, [conversations, models])

  const lastActivities = useMemo(() => {
    const items = []
    for (const c of conversations.slice(0, 5)) {
      const last = c.messages?.[c.messages.length - 1]
      const modelName = models.find(mm => mm.id === (c.model || models[0]?.id))?.name || c.model
      if (last) items.push(`Mensagem ${last.role === 'user' ? 'enviada' : 'recebida'} (${modelName})`)
      else items.push(`Chat criado (${modelName})`)
    }
    for (const ai of (myAIs || []).slice(0, 3)) {
      items.push(`AI criada: ${ai.name}`)
    }
    return items.slice(0, 6)
  }, [conversations, myAIs, models])

  const chatsPerDay = useMemo(() => {
    const days = {}
    for (const c of conversations) {
      const d = new Date(c.createdAt || Date.now())
      const key = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`
      days[key] = (days[key] || 0) + 1
    }
    const entries = Object.entries(days).sort(([a], [b]) => (a < b ? -1 : 1))
    return entries.slice(-7)
  }, [conversations])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border dark:border-gray-800 bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute -top-10 -left-10 h-40 w-40 bg-brand-500/20 blur-2xl rounded-full" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-indigo-500/20 blur-2xl rounded-full" />
        <div className="relative p-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">Bem-vindo{user?.name ? `, ${user.name}` : ''}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Aqui está um resumo do seu uso</div>
            <div className="mt-3 flex gap-2">
              <a href="/home/chats" className="px-3 py-2 text-sm rounded-md bg-brand-600 text-white">Novo chat</a>
              <a href="/home/create-ai" className="px-3 py-2 text-sm rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50">Criar AI</a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/70 dark:bg-gray-800/60 backdrop-blur p-3 border dark:border-gray-700">
              <div className="text-[11px] text-gray-600 dark:text-gray-400">Chats</div>
              <div className="text-xl font-semibold">{conversations.length}</div>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-gray-800/60 backdrop-blur p-3 border dark:border-gray-700">
              <div className="text-[11px] text-gray-600 dark:text-gray-400">Mensagens</div>
              <div className="text-xl font-semibold">{conversations.reduce((n, c) => n + (c.messages?.length || 0), 0)}</div>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-gray-800/60 backdrop-blur p-3 border dark:border-gray-700">
              <div className="text-[11px] text-gray-600 dark:text-gray-400">AIs</div>
              <div className="text-xl font-semibold">{myAIs.length}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Chats por dia (últimos 7)</div>
          {chatsPerDay.length > 0 ? (
            <svg viewBox="0 0 320 120" className="w-full h-32">
              {chatsPerDay.map(([day, count], i) => (
                <g key={day}>
                  <rect x={i * 40 + 10} y={120 - count * 15} width={24} height={count * 15} rx={6} fill="#394af0" opacity="0.85" />
                  <text x={i * 40 + 10} y={115} fontSize="9" fill="#6b7280">{day.slice(5)}</text>
                </g>
              ))}
            </svg>
          ) : (
            <div className="h-32 grid place-items-center rounded-md border border-dashed dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">Sem dados ainda</div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Modelos mais usados</div>
          <ul className="mt-3 space-y-2 text-sm">
            {modelUsage.length === 0 && <li className="text-gray-600 dark:text-gray-400">Sem uso ainda</li>}
            {modelUsage.map(m => (
              <li key={m.id} className="flex justify-between"><span>{m.name}</span><span className="font-semibold">{m.pct}%</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Últimas atividades</div>
          <ul className="mt-3 space-y-2 text-sm">
            {lastActivities.length === 0 && <li className="text-gray-600 dark:text-gray-400">Sem atividades recentes</li>}
            {lastActivities.map((a, i) => (<li key={i}>{a}</li>))}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Suas AIs</div>
          {loadingAIs && (
            <div className="mt-3 space-y-2">
              <div className="h-4 w-28 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-4 w-40 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          )}
          {errorAIs && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{errorAIs}</div>}
          {!loadingAIs && !errorAIs && (
            <div className="mt-3 space-y-2 text-sm">
              <div>Total: <span className="font-semibold">{myAIs.length}</span></div>
              <ul className="space-y-1">
                {myAIs.slice(0, 3).map(ai => (<li key={ai.id}>{ai.name}</li>))}
                {myAIs.length === 0 && <li className="text-gray-600 dark:text-gray-400">Você ainda não criou AIs</li>}
              </ul>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Resumo</div>
          <div className="mt-3 text-sm space-y-2">
            <div>Chats: <span className="font-semibold">{conversations.length}</span></div>
            <div>Mensagens: <span className="font-semibold">{conversations.reduce((n, c) => n + (c.messages?.length || 0), 0)}</span></div>
            <div>Modelos: <span className="font-semibold">{models.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
