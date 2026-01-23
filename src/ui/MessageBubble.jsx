export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  async function handleDownload(src) {
    try {
      const url = src
      if (url.startsWith('data:image')) {
        const parts = url.split(',')
        const mime = (parts[0].match(/data:(.*?);/) || [])[1] || 'image/png'
        const bstr = atob(parts[1])
        const n = bstr.length
        const u8 = new Uint8Array(n)
        for (let i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i)
        const blob = new Blob([u8], { type: mime })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `imagem-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(a.href)
        return
      }
      const res = await fetch(url, { credentials: 'include' })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      const name = url.split('/').pop() || `imagem-${Date.now()}.png`
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch {}
  }
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {typeof content === 'string' && ((content.startsWith('data:image') || content.startsWith('http') || content.startsWith('/uploads/'))) && !isUser ? (
        <div className="relative max-w-md">
          <img src={content} alt="image" className="w-full max-w-md max-h-64 rounded-xl object-cover border dark:border-gray-800" />
          <button onClick={() => handleDownload(content)} className="absolute top-2 right-2 px-3 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur hover:bg-black/60">
            Baixar
          </button>
        </div>
      ) : (
        <div
          className={`max-w-xl rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
            isUser ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
