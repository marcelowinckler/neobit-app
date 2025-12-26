import { useState } from 'react'
import { useChat } from '../context/ChatContext'

export default function ChatInput({ disabled }) {
  const [value, setValue] = useState('')
  const { sendMessage, currentModel, setModel, models, currentConversation, t } = useChat()
  const COMMANDS = [
    { key: '/img', title: 'img', desc: 'Gerar imagem' },
    { key: '/dev', title: 'dev', desc: 'Gerar e visualizar código' },
    { key: '/mude', title: 'mude', desc: 'Alterar código existente' },
    { key: '/web', title: 'web', desc: 'Pesquisar e sintetizar' },
    { key: '/help', title: 'help', desc: 'Listar comandos disponíveis' }
  ]
  const showCmd = value.startsWith('/')
  const q = value.replace(/^\s*\/?/, '').toLowerCase()
  const filtered = !q || q === '' || q === '/' ? COMMANDS : COMMANDS.filter(c => c.title.startsWith(q))

  function onSend() {
    if (!value.trim()) return
    let msg = value
    if (/^\/dev\b/i.test(msg.trim())) {
      msg = msg.trim() + ' faça com tailwind de forma moderna e estilosa. nao coloque textos a mais como "Aqui está o HTML completo de uma landing page moderna e estilosa para uma pizzaria italiana, utilizando apenas Tailwind CSS via CDN:" deixe apenas o site puro, estilo e moderno, sem texto explicativos da sua parte'
    }
    sendMessage(msg)
    setValue('')
  }

  return (
    <div className="px-6 pt-4 pb-6 h-52">
      <div className="max-w-4xl mx-auto h-full">
        {!currentConversation?.aiId && (
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">{t('model')}</div>
            <select
              className="text-xs border dark:border-gray-800 rounded-md px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100"
              value={currentModel}
              onChange={e => setModel(e.target.value)}
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="h-[calc(100%-1.75rem)] relative">
          {showCmd && (
            <div className="absolute -top-2 left-0 right-20 translate-y-[-100%]">
              <div className="rounded-md border dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md p-2">
                <div className="text-xs mb-1 px-1 text-gray-700 dark:text-gray-300">Comandos</div>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map(c => (
                    <button
                      key={c.key}
                      className="text-left rounded-md px-3 py-2 border dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onMouseDown={e => {
                        e.preventDefault()
                        setValue(c.key + ' ')
                      }}
                    >
                      <div className="text-sm font-medium">/{c.title}</div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 rounded-2xl ring-1 ring-brand-500">
              <textarea
                className="w-full resize-none rounded-2xl px-5 py-4 text-sm outline-none bg-white dark:bg-gray-800 dark:text-gray-100 h-32 overflow-y-auto shadow-sm"
                rows={8}
                placeholder={disabled ? 'Crie um novo chat para enviar mensagens' : 'Digite sua mensagem'}
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={disabled}
              />
            </div>
            <button
              onClick={onSend}
              disabled={disabled}
              className="self-center px-4 py-3 rounded-xl bg-brand-600 text-white disabled:opacity-50"
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
