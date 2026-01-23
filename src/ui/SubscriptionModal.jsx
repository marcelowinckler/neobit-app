import { useState, useEffect } from 'react'
import { useChat } from '../context/ChatContext'

export default function SubscriptionModal() {
  const { user } = useChat()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!user || !user.created_at) {
      setShow(false)
      return
    }

    // Admin não tem limite de trial
    if (user.email === 'matrixbit@gmail.com') {
      setShow(false)
      return
    }

    const check = () => {
      const now = Date.now()
      const diff = now - user.created_at
      // 1 day in milliseconds
      if (diff > 24 * 60 * 60 * 1000) {
        setShow(true)
      }
    }

    check()
    const interval = setInterval(check, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [user])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Seu período de teste acabou</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Você utilizou nossos serviços gratuitos por 1 dia. Para continuar acessando as melhores IAs do mercado, escolha um plano abaixo.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Mês</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">R$99,99/mês</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2"><CheckIcon /> Acesso ilimitado</li>
                <li className="flex items-center gap-2"><CheckIcon /> Todos os modelos</li>
                <li className="flex items-center gap-2"><CheckIcon /> Suporte prioritário</li>
              </ul>
              <button className="mt-6 w-full py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition">
                Assinar Mensal
              </button>
            </div>

            <div className="rounded-2xl border-2 border-brand-500 bg-white dark:bg-gray-900 p-6 shadow-lg relative transform scale-105">
              <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">POPULAR</div>
              <div className="text-xs uppercase tracking-wide text-brand-600 dark:text-brand-400 font-bold">Semestral</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">R$499/6 meses</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2"><CheckIcon /> Tudo do mensal</li>
                <li className="flex items-center gap-2"><CheckIcon /> Economize 15%</li>
                <li className="flex items-center gap-2"><CheckIcon /> Acesso antecipado</li>
              </ul>
              <button className="mt-6 w-full py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition shadow-lg shadow-brand-500/20">
                Assinar Semestral
              </button>
            </div>

            <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Anual</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">R$999/ano</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2"><CheckIcon /> Tudo incluído</li>
                <li className="flex items-center gap-2"><CheckIcon /> Economize 20%</li>
                <li className="flex items-center gap-2"><CheckIcon /> Mentoria exclusiva</li>
              </ul>
              <button className="mt-6 w-full py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition">
                Assinar Anual
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Pagamento seguro via Stripe. Cancele quando quiser.
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-brand-500" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}
