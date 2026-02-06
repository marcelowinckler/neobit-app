import { useRef, useState } from 'react'
import { useChat } from '../context/ChatContext'

export default function ChatInput({ disabled }) {
  const [value, setValue] = useState('')
  const [recording, setRecording] = useState(false)
  const [recError, setRecError] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
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
    sendMessage(value)
    setValue('')
  }
  
  async function startRecording() {
    setRecError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const type = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr = new MediaRecorder(stream, { mimeType: type })
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type })
          const reader = new FileReader()
          reader.onloadend = async () => {
            try {
              const dataUrl = typeof reader.result === 'string' ? reader.result : ''
              const res = await fetch('/api/audio/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ data_url: dataUrl })
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Falha na transcrição')
              }
              const json = await res.json()
              const text = (json && json.text) || ''
              if (text.trim()) {
                sendMessage(text.trim())
              } else {
                setRecError('Transcrição vazia')
              }
            } catch (e) {
              setRecError(e.message || 'Falha na transcrição')
            }
          }
          reader.readAsDataURL(blob)
        } catch (e) {
          setRecError(e.message || 'Falha ao processar áudio')
        } finally {
          // Stop all tracks
          try {
            stream.getAudioTracks().forEach(t => t.stop())
          } catch {}
        }
      }
      mediaRecorderRef.current = mr
      mr.start()
      setRecording(true)
    } catch (e) {
      setRecError(e.message || 'Permissão de microfone negada')
      setRecording(false)
    }
  }
  
  async function stopRecording() {
    try {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        mr.stop()
      }
    } catch {}
    setRecording(false)
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
              onClick={recording ? stopRecording : startRecording}
              disabled={disabled}
              title={recording ? 'Parar e transcrever' : 'Gravar áudio'}
              className={`self-center h-10 w-10 rounded-full border dark:border-gray-700 grid place-items-center ${
                recording ? 'bg-red-600 text-white animate-pulse' : 'bg-white dark:bg-gray-800 text-gray-700'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                {recording ? (
                  <path d="M7 10a5 5 0 1010 0v0a5 5 0 10-10 0v0zM12 15v4M8 19h8" />
                ) : (
                  <path d="M12 3a3 3 0 013 3v6a3 3 0 11-6 0V6a3 3 0 013-3zm0 12v4m-4 0h8" />
                )}
              </svg>
            </button>
            <button
              onClick={onSend}
              disabled={disabled}
              className="self-center px-4 py-3 rounded-xl bg-brand-600 text-white disabled:opacity-50"
            >
              {t('send')}
            </button>
          </div>
          {recError && (
            <div className="mt-2 text-xs text-red-600">{recError}</div>
          )}
        </div>
      </div>
    </div>
  )
}
