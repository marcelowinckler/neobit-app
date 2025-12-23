import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function EditAI() {
  const { id } = useParams()
  const { models } = useChat()
  const [name, setName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(models[0]?.id || 'gpt-4o-mini')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageData, setImageData] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/ais/${id}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Falha ao carregar AI')
        const data = await res.json()
        const ai = data.ai
        setName(ai.name || '')
        setShortDesc(ai.short_desc || '')
        setPrompt(ai.prompt || '')
        setModel(ai.model || models[0]?.id || 'gpt-4o-mini')
        if (ai.image_url) setImagePreview(ai.image_url)
        setIsPublic(!!ai.is_public)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function onSave() {
    setError('')
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    try {
      const res = await fetch(`/api/ais/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, short_desc: shortDesc, prompt, model, image_data: imageData, image_url: imageData, is_public: isPublic })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao salvar AI')
      }
      navigate('/home/custom-ais')
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div className="text-sm">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Editar AI</div>
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-6 space-y-4 max-w-2xl">
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
        <div>
          <label className="text-sm">Nome</label>
          <input className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Descrição curta</label>
          <input className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Prompt</label>
          <textarea className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" rows={6} value={prompt} onChange={e => setPrompt(e.target.value)} />
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
          <label className="text-sm">Imagem</label>
          <input type="file" accept="image/*" className="text-sm" onChange={e => {
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
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Prévia" className="h-24 w-24 object-cover rounded-md border dark:border-gray-800" />
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
        <div className="flex gap-2">
          <button onClick={onSave} className="px-4 py-2 rounded-md bg-brand-600 text-white">Salvar</button>
          <button onClick={() => navigate('/home/custom-ais')} className="px-4 py-2 rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
