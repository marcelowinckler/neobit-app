import { createContext, useContext, useMemo, useState, useEffect } from 'react'

const ChatContext = createContext(null)

function uid() {
  return Math.random().toString(36).slice(2)
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const MODELS = [
  { id: 'gpt-4o-mini', name: 'ChatGPT 4o mini' }
]

export function ChatProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [isWorking, setIsWorking] = useState(false)
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL)
  const [conversations, setConversations] = useState(() => {
    const raw = localStorage.getItem('conversations')
    return raw ? JSON.parse(raw) : []
  })
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'pt-BR')
  const [preferredName, setPreferredName] = useState(() => localStorage.getItem('preferredName') || '')
  const [aiPersona, setAIPersona] = useState(() => localStorage.getItem('aiPersona') || '')

  const DICT = {
    'pt-BR': {
      home: 'Home',
      chats: 'Chats',
      my_ais: 'Minhas AIs',
      marketplace: 'Marketplace',
      create_ai: 'Criar Nova AI',
      plans: 'Planos',
      settings: 'Configurações',
      new_chat: 'Novo chat',
      rename: 'Renomear',
      delete: 'Excluir',
      model: 'Modelo',
      send: 'Enviar',
      language: 'Idioma',
      appearance: 'Aparência',
      light: 'Claro',
      dark: 'Escuro',
      use_ai: 'Usar AI',
      open: 'Abrir',
      edit: 'Editar'
    },
    en: {
      home: 'Home',
      chats: 'Chats',
      my_ais: 'My AIs',
      marketplace: 'Marketplace',
      create_ai: 'Create New AI',
      plans: 'Plans',
      settings: 'Settings',
      new_chat: 'New chat',
      rename: 'Rename',
      delete: 'Delete',
      model: 'Model',
      send: 'Send',
      language: 'Language',
      appearance: 'Appearance',
      light: 'Light',
      dark: 'Dark',
      use_ai: 'Use AI',
      open: 'Open',
      edit: 'Edit'
    }
  }

  function t(key) {
    const dict = DICT[language] || DICT['pt-BR']
    return dict[key] || key
  }

  useEffect(() => {
    try {
      localStorage.setItem('conversations', JSON.stringify(conversations))
    } catch {}
  }, [conversations])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('preferredName', preferredName)
  }, [preferredName])

  useEffect(() => {
    localStorage.setItem('aiPersona', aiPersona)
  }, [aiPersona])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          try {
            const pr = await fetch('/api/user/preferences', { credentials: 'include' })
            if (pr.ok) {
              const prefs = await pr.json()
              if (prefs?.preferred_name) setPreferredName(prefs.preferred_name)
              if (prefs?.persona) setAIPersona(prefs.persona)
            }
          } catch {}
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
      setAuthReady(true)
    })()
  }, [])

  // Sync conversations to server
  useEffect(() => {
    if (authReady && user && conversations.length > 0) {
      const timer = setTimeout(() => {
        fetch('/api/user/conversations/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ conversations })
        }).catch(() => {})
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [conversations, user, authReady])

  function createConversation() {
    const id = uid()
    const nextIndex = (conversations?.length || 0) + 1
    const title = `Chat ${nextIndex}`
    const convo = { id, title, model: currentModel, messages: [], createdAt: Date.now(), devUrl: null, devCode: '' }
    setConversations(prev => [convo, ...prev])
    setCurrentConversationId(id)
    return id
  }

  function createConversationWithAI(ai) {
    const id = uid()
    const nextIndex = (conversations?.length || 0) + 1
    const title = `Chat ${nextIndex} by ${ai?.name || 'AI'}`
    const convo = { id, title, model: ai?.model || currentModel, aiId: ai?.id, aiName: ai?.name || null, messages: [], createdAt: Date.now(), devUrl: null, devCode: '' }
    setConversations(prev => [convo, ...prev])
    setCurrentConversationId(id)
    if (ai?.model) setCurrentModel(ai.model)
    return id
  }

  function selectConversation(id) {
    setCurrentConversationId(id)
  }

  function renameConversation(id, title) {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, title: title || c.title } : c)))
  }

  function deleteConversation(id) {
    setConversations(prev => prev.filter(c => c.id !== id))
    setCurrentConversationId(prevId => (prevId === id ? null : prevId))
  }

  function setModel(model) {
    setCurrentModel(model)
  }

  function importConversation({ title, model, aiId, messages }) {
    const id = uid()
    const convo = {
      id,
      title: title || `Chat ${((conversations?.length || 0) + 1)}`,
      model: model || currentModel,
      aiId: aiId || null,
      messages: Array.isArray(messages) ? messages.filter(m => m && m.role && m.content) : [],
      createdAt: Date.now(),
      devUrl: null,
      devCode: ''
    }
    setConversations(prev => [convo, ...prev])
    setCurrentConversationId(id)
    if (model) setCurrentModel(model)
    return id
  }

  async function typeOutTitle(id, fullTitle) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: '' } : c))
    const chunk = 1
    let i = 0
    async function step() {
      const limit = i + chunk
      setConversations(prev => prev.map(c => {
        if (c.id !== id) return c
        return { ...c, title: fullTitle.slice(0, limit) }
      }))
      i += chunk
      if (i < fullTitle.length) {
        await new Promise(r => setTimeout(r, 50))
        step()
      }
    }
    await step()
  }

  async function generateTitle(id, firstMessage) {
    try {
      const res = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: firstMessage })
      })
      if (res.ok) {
        const data = await res.json()
        const newTitle = data.title
        if (newTitle) {
          typeOutTitle(id, newTitle)
        }
      }
    } catch (e) {
      console.error('Failed to generate title', e)
    }
  }

  async function sendMessage(text) {
    if (!currentConversationId) return
    
    // Check for auto-rename trigger (first message or default title)
    const currentConvo = conversations.find(c => c.id === currentConversationId)
    const isDefaultTitle = /^Chat \d+$/.test(currentConvo?.title || '')
    const hasUserMessages = (currentConvo?.messages || []).some(m => m.role === 'user')
    
    if (isDefaultTitle && !hasUserMessages) {
      generateTitle(currentConversationId, text)
    }

    setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, messages: [...c.messages, { role: 'user', content: text }] } : c))
    const convo = conversations.find(c => c.id === currentConversationId)
    const wantsImage = (
      /^\s*\/(img|image)\b/i.test(text) ||
      ((/imagem|image|foto|desenho|ilustra(?:ção|cao)|picture|artwork|banner|logo|ícone|icone/i.test(text)) &&
       (/cria|criar|gerar|faça|fazer|make|create|generate|produzir|renderizar/i.test(text)))
    )
    const wantsWeb = /^\s*\/(web|search|pesquisa|buscar)\b/i.test(text)
    const wantsDev = /^\s*\/(dev)\b/i.test(text)
    const wantsMude = /^\s*\/(mude|change|edit|alterar|modificar)\b/i.test(text)
    const wantsDevEdit = wantsMude || (!wantsDev && !!convo?.devUrl && /\b(mud|alter|ajust|refator|melhor|adicion|remov|troc|deix|fic|coloq|ponh|insir|fa[çc]a|config|arrum|consert|bot(?:[ãa]o|[õo]es)|cor(?:es)?|layout|font|menu|responsiv|anima|link|cliqu|clic|rola|scroll|efeito|fundo|back|t[íi]tulo|texto|imag|img|estilo|css|html|script|js|landing|hero|card|grid|gradient|glass|use|usar|aplique|redirecion|naveg|site|pagina|página)\w*\b/i.test(text))
    try {
      if (wantsImage) {
        setIsWorking(true)
        const prompt = text.replace(/^\s*\/(img|image)\s*/i, '').trim() || text
        const ir = await fetch('/api/images/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ prompt })
        })
        if (!ir.ok) {
          const err = await ir.json().catch(() => ({}))
          throw new Error(err.error || 'Falha ao gerar imagem')
        }
        const img = await ir.json()
        const url = img?.image_url || img?.image_data || ''
        setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, messages: [...c.messages, { role: 'assistant', content: url || '[sem imagem]' }] } : c))
        setIsWorking(false)
      } else if (wantsWeb) {
        setIsWorking(true)
        const query = text.replace(/^\s*\/(web|search|pesquisa|buscar)\s*/i, '').trim() || text
        const sr = await fetch('/api/search/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query, preferred_name: preferredName || null, persona: aiPersona || null })
        })
        if (!sr.ok) {
          const err = await sr.json().catch(() => ({}))
          throw new Error(err.error || 'Falha ao pesquisar')
        }
        const data = await sr.json()
        const reply = data?.message?.content || ''
        setIsWorking(false)
        await typeOutAssistant(reply || '[sem resposta]')
      } else if (wantsDev || wantsDevEdit) {
        setIsWorking(true)
        let prompt = text
        if (wantsDev) prompt = text.replace(/^\s*\/(dev)\s*/i, '').trim() || text
        if (wantsMude) prompt = text.replace(/^\s*\/(mude|change|edit|alterar|modificar)\s*/i, '').trim() || text
        
        let baseHtml = convo?.devCode || ''
        if (!baseHtml && convo?.devUrl) {
          try {
            const r = await fetch(convo.devUrl, { credentials: 'include' })
            if (r.ok) baseHtml = await r.text()
          } catch {}
        }
        
        // Determine mode: 'edit' if specifically requested or editing existing devUrl without /dev command
        // 'create' if /dev command used (even if baseHtml exists)
        const mode = wantsDevEdit ? 'edit' : 'create'
        
        const dr = await fetch('/api/dev/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ prompt, base_html: baseHtml, mode })
        })
        if (!dr.ok) {
          const err = await dr.json().catch(() => ({}))
          throw new Error(err.error || 'Falha ao gerar preview')
        }
        const data = await dr.json()
        const url = data?.url || ''
        const html = data?.html || ''
        setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, devUrl: url, devCode: html, messages: [...c.messages, { role: 'assistant', content: `Preview gerado: ${url}` }] } : c))
        setIsWorking(false)
      } else {
        setIsWorking(true)
        const payload = {
          messages: [...(convo?.messages || []), { role: 'user', content: text }],
          aiId: convo?.aiId || null,
          model: 'gpt-4o-mini',
          preferred_name: preferredName || null,
          persona: aiPersona || null
        }
        const res = await fetch('/api/chat/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Falha ao responder')
        }
        const data = await res.json()
        const reply = data?.message?.content || ''
        setIsWorking(false)
        await typeOutAssistant(reply || '[sem resposta]')
      }
    } catch (e) {
      setIsWorking(false)
      setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Erro: ${e.message}` }] } : c))
    }
  }

  function mockReply(text) {
    const m = currentModel
    return `(${m}) ${text.split('').reverse().join('')}`
  }

  async function typeOutAssistant(fullText) {
    const id = currentConversationId
    if (!id) return
    setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: [...c.messages, { role: 'assistant', content: '' }] } : c))
    const chunk = 3
    let i = 0
    async function step() {
      const limit = i + chunk
      setConversations(prev => prev.map(c => {
        if (c.id !== id) return c
        const msgs = [...c.messages]
        msgs[msgs.length - 1] = { role: 'assistant', content: fullText.slice(0, limit) }
        return { ...c, messages: msgs }
      }))
      i += chunk
      if (i < fullText.length) {
        await new Promise(r => setTimeout(r, 15))
        step()
      }
    }
    await step()
  }

  async function loginWithEmail(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
      let errorMessage = 'Falha no login'
      try {
        const err = await res.json()
        errorMessage = err.error || errorMessage
      } catch {
        const text = await res.text().catch(() => '')
        console.error('Login failed (non-JSON):', text)
        errorMessage = `Erro servidor: ${res.status}`
      }
      throw new Error(errorMessage)
    }
    const data = await res.json()
    setUser(data.user)
  }

  async function signup(email, password, name) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name })
    })
    if (!res.ok) {
      let errorMessage = 'Falha no cadastro'
      try {
        const err = await res.json()
        errorMessage = err.error || errorMessage
      } catch {
        // If not JSON, try text
        const text = await res.text().catch(() => '')
        console.error('Signup failed (non-JSON):', text)
        errorMessage = `Erro servidor: ${res.status} ${text ? `(${text.slice(0, 100)})` : ''}`
      }
      throw new Error(errorMessage)
    }
    const data = await res.json()
    setUser(data.user)
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      setUser(null)
    }
  }

  async function loginWithGoogle(idToken) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id_token: idToken })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Falha no login Google')
    }
    const data = await res.json()
    setUser(data.user)
  }

  const currentConversation = useMemo(() => conversations.find(c => c.id === currentConversationId) || null, [conversations, currentConversationId])

  const value = {
    user,
    authReady,
    conversations,
    currentConversation,
    currentConversationId,
    currentModel,
    models: MODELS,
    createConversation,
    createConversationWithAI,
    selectConversation,
    renameConversation,
    deleteConversation,
    setModel,
    theme,
    setTheme,
    language,
    setLanguage,
    preferredName,
    setPreferredName,
    aiPersona,
    setAIPersona,
    t,
    sendMessage,
    loginWithEmail,
    loginWithGoogle,
    signup,
    logout,
    importConversation,
    isWorking
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  return useContext(ChatContext)
}
