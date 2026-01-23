import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function CreateAI() {
  const { models } = useChat()
  const [name, setName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(models[0]?.id || 'gpt-4o-mini')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageData, setImageData] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [promptFiles, setPromptFiles] = useState([])
  const navigate = useNavigate()

  async function onCreate() {
    setError('')
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, short_desc: shortDesc, prompt, model, image_data: imageData, image_url: imageData, is_public: isPublic })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao criar AI')
      }
      setName('')
      setShortDesc('')
      setPrompt('')
      setModel(models[0]?.id || 'gpt-4o')
      setImageData('')
      setImagePreview('')
      setIsPublic(false)
      setPromptFiles([])
      alert('AI criada! Ela aparecerá em AIs Customizadas e no Marketplace.')
      if (isPublic) navigate('/home/marketplace')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Criar Nova AI</div>
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-6 space-y-4 max-w-2xl">
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
        <div>
          <label className="text-sm">Nome</label>
          <input className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Ex: Analista Financeiro" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Descrição curta</label>
          <input className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Ex: Ajuda com análises" value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Prompt</label>
          <textarea className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" rows={6} placeholder="Instruções e contexto" value={prompt} onChange={e => setPrompt(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Modelo</label>
          <select className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" value={model} onChange={e => setModel(e.target.value)}>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Importar prompt (.txt/.md)</label>
          <div className="mt-2">
            <input id="ai-prompt-files" type="file" accept=".txt,.md,text/plain" multiple className="hidden" onChange={async e => {
              const files = Array.from(e.target.files || [])
              if (files.length === 0) return
              setPromptFiles(files.map(f => f.name))
              const texts = await Promise.all(files.map(f => new Promise((resolve, reject) => {
                const r = new FileReader()
                r.onload = () => resolve(typeof r.result === 'string' ? r.result : '')
                r.onerror = reject
                r.readAsText(f)
              })))
              const combined = texts.join('\n\n').trim()
              setPrompt(prev => prev ? (prev + '\n\n' + combined) : combined)
            }} />
            <label htmlFor="ai-prompt-files" className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed dark:border-gray-800 px-4 py-6 text-sm bg-white hover:bg-gray-50 dark:bg-gray-800/60 dark:hover:bg-gray-800 cursor-pointer transition">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gray-600 dark:text-gray-300"><path d="M4 6h16v12H4V6zm5 3h6M9 13h6" stroke="currentColor" strokeWidth="1.5"/></svg>
              <span>Adicionar arquivos .txt/.md</span>
            </label>
            {promptFiles.length > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="mb-1">Arquivos:</div>
                <ul className="space-y-1">
                  {promptFiles.slice(0, 4).map((n, i) => (<li key={i}>{n}</li>))}
                  {promptFiles.length > 4 && (<li>+{promptFiles.length - 4} mais</li>)}
                </ul>
                <button type="button" className="mt-2 px-2 py-1 rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50" onClick={() => { setPromptFiles([]) }}>Limpar lista</button>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm">Imagem</label>
          {!imagePreview && (
            <div className="mt-2">
              <input id="ai-image" type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const dataUrl = reader.result
                  setImageData(typeof dataUrl === 'string' ? dataUrl : '')
                  setImagePreview(typeof dataUrl === 'string' ? dataUrl : '')
                }
                reader.readAsDataURL(file)
              }} />
              <label htmlFor="ai-image" className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed dark:border-gray-800 px-4 py-8 text-sm bg-white hover:bg-gray-50 dark:bg-gray-800/60 dark:hover:bg-gray-800 cursor-pointer transition">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gray-600 dark:text-gray-300"><path d="M12 5v8m0 0l-3-3m3 3l3-3M4 17h16" stroke="currentColor" strokeWidth="1.5"/></svg>
                <span>Adicionar imagem</span>
              </label>
              <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">PNG/JPG até 2MB</div>
            </div>
          )}
          {imagePreview && (
            <div className="mt-2 flex items-center gap-3">
              <img src={imagePreview} alt="Prévia" className="h-20 w-20 object-cover rounded-xl border dark:border-gray-800" />
              <div className="flex flex-col gap-2">
                <label htmlFor="ai-image" className="px-3 py-2 text-sm rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50 cursor-pointer">Trocar imagem</label>
                <button type="button" className="px-3 py-2 text-sm rounded-md bg-red-600 text-white" onClick={() => { setImageData(''); setImagePreview('') }}>Remover</button>
                <input id="ai-image" type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const dataUrl = reader.result
                    setImageData(typeof dataUrl === 'string' ? dataUrl : '')
                    setImagePreview(typeof dataUrl === 'string' ? dataUrl : '')
                  }
                  reader.readAsDataURL(file)
                }} />
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm">Visibilidade</label>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="vis" checked={!isPublic} onChange={() => setIsPublic(false)} />
              <span>Privada</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="vis" checked={isPublic} onChange={() => setIsPublic(true)} />
              <span>Pública (aparece no Marketplace)</span>
            </label>
          </div>
        </div>
        <button disabled={loading} onClick={onCreate} className="px-4 py-2 rounded-md bg-brand-600 text-white disabled:opacity-50">{loading ? 'Criando...' : 'Criar'}</button>
      </div>
    </div>
  )
}
