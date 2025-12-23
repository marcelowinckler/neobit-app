import { Link } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function Plans() {
  const { t } = useChat()
  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">{t('plans')}</div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Mês</div>
          <div className="mt-1 text-2xl font-bold">R$99,99/mês</div>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li>Acesso a todos os modelos de IA</li>
            <li>Histórico ilimitado</li>
            <li>Bots personalizados</li>
            <li>Sincronização em múltiplos dispositivos</li>
            <li>Geração de imagens HD</li>
          </ul>
          <Link to="/signup" className="mt-6 block text-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700">Assinar mensal</Link>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-6 shadow-sm ring-2 ring-brand-500">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Semestral</div>
          <div className="mt-1 text-2xl font-bold">R$499/6 meses</div>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li>Acesso a todos os modelos de IA</li>
            <li>Histórico ilimitado</li>
            <li>Bots personalizados</li>
            <li>Sincronização em múltiplos dispositivos</li>
            <li>Geração de imagens HD</li>
          </ul>
          <Link to="/signup" className="mt-6 block text-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700">Assinar semestral</Link>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Anual</div>
          <div className="mt-1 text-2xl font-bold">R$999/ano</div>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li>Acesso a todos os modelos de IA</li>
            <li>Histórico ilimitado</li>
            <li>Bots personalizados</li>
            <li>Sincronização em múltiplos dispositivos</li>
            <li>Geração de imagens HD</li>
          </ul>
          <Link to="/signup" className="mt-6 block text-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700">Assinar anual</Link>
        </div>
      </div>
    </div>
  )
}

