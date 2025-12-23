import { useChat } from '../context/ChatContext'
import { useState } from 'react'

export default function Settings() {
  const { theme, setTheme, language, setLanguage, preferredName, setPreferredName, aiPersona, setAIPersona, t } = useChat()
  const [saved, setSaved] = useState(false)
  function onSave() {
    try {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferred_name: preferredName || '', persona: aiPersona || '' })
      }).catch(() => {})
      localStorage.setItem('preferredName', preferredName || '')
      localStorage.setItem('aiPersona', aiPersona || '')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }
  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">{t('settings')}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="text-sm font-medium">Conta</div>
          <div>
            <label className="text-sm">{t('language')}</label>
            <select
              className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="pt-BR">Português (BR)</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{t('language')}: {language}</div>
          <div className="mt-4">
            <label className="text-sm">Como você gostaria de ser Chamado?</label>
            <input
              className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
              value={preferredName}
              onChange={e => setPreferredName(e.target.value)}
              placeholder="Seu nome preferido"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ex.: João, Jota, Boss</div>
          </div>
          <div>
            <label className="text-sm">Como você gostaria que a AI Agisse com você?</label>
            <input
              className="w-full border dark:border-gray-800 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
              value={aiPersona}
              onChange={e => setAIPersona(e.target.value)}
              placeholder="Ex.: informal, mentor, direto, engraçada, profissional"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Define o tom e estilo das respostas</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSave} className="px-3 py-2 text-sm rounded-md bg-brand-600 text-white">Salvar preferências</button>
            {saved && <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">Preferências salvas</div>}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="text-sm font-medium">{t('appearance')}</div>
          <div className="flex items-center gap-3">
            <button
              className={`px-3 py-2 text-sm rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50 ${theme === 'light' ? 'ring-2 ring-brand-500' : ''}`}
              onClick={() => setTheme('light')}
            >{t('light')}</button>
            <button
              className={`px-3 py-2 text-sm rounded-md border bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50 ${theme === 'dark' ? 'ring-2 ring-brand-500' : ''}`}
              onClick={() => setTheme('dark')}
            >{t('dark')}</button>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{t('appearance')}: {theme}</div>
        </div>
      </div>
    </div>
  )
}
