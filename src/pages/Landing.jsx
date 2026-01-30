import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-600 text-white grid place-items-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 3l8 4-8 4-8-4 8-4zM4 10l8 4 8-4v7l-8 4-8-4v-7z" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <div className="font-semibold">NeoBit</div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-gray-50">Entrar</Link>
            <Link to="/signup" className="text-sm px-3 py-1 rounded-md bg-brand-600 text-white hover:bg-brand-700">Cadastrar</Link>
          </div>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold leading-tight">A melhor IA, tudo em um só lugar</h1>
                <p className="text-gray-700 text-sm md:text-base">Acesse os melhores modelos de IA do mundo em uma única plataforma. Seu chat sincronizado em todos os dispositivos.</p>
                <div className="flex gap-3">
                  <Link to="/signup" className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700">Começar agora</Link>
                  <Link to="/login" className="px-4 py-2 rounded-md border bg-white text-sm hover:bg-gray-50">Já tenho conta</Link>
                </div>
                <div className="text-xs text-gray-600">Pagamento seguro • Cancele quando quiser • Garantia de 7 dias</div>
              </div>
              <div className="relative h-64 md:h-72">
                <div className="absolute left-4 md:left-10 top-3 md:top-5 neo-float neo-float-1">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border shadow-lg grid place-items-center bg-gradient-to-br from-gray-100 to-gray-300">
                    <span className="text-xs font-semibold">OpenAI</span>
                  </div>
                </div>
                <div className="absolute left-[22%] top-14 neo-float neo-float-2">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border shadow-lg grid place-items-center bg-gradient-to-br from-orange-100 to-orange-300">
                    <span className="text-xs font-semibold">Claude</span>
                  </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-6 neo-float neo-float-3">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border shadow-lg grid place-items-center bg-gradient-to-br from-blue-100 to-blue-300">
                    <span className="text-xs font-semibold">Gemini</span>
                  </div>
                </div>
                <div className="absolute right-[22%] top-16 neo-float neo-float-4">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border shadow-lg grid place-items-center bg-gradient-to-br from-slate-100 to-slate-300">
                    <span className="text-xs font-semibold">Grok</span>
                  </div>
                </div>
                <div className="absolute right-4 md:right-10 top-10 neo-float">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border shadow-lg grid place-items-center bg-gradient-to-br from-emerald-100 to-emerald-300">
                    <span className="text-xs font-semibold">Perplexity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-2xl font-semibold">Escolha seu plano</div>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500">Mês</div>
              <div className="mt-1 text-2xl font-bold">R$99,99/mês</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>Acesso a todos os modelos de IA</li>
                <li>Histórico ilimitado</li>
                <li>Bots personalizados</li>
                <li>Sincronização em múltiplos dispositivos</li>
                <li>Geração de imagens HD</li>
              </ul>
              <Link to="/signup" className="mt-6 block text-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700">Assinar mensal</Link>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm ring-2 ring-brand-500">
              <div className="text-xs uppercase tracking-wide text-gray-500">Semestral</div>
              <div className="mt-1 text-2xl font-bold">R$499/6 meses</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>Acesso a todos os modelos de IA</li>
                <li>Histórico ilimitado</li>
                <li>Bots personalizados</li>
                <li>Sincronização em múltiplos dispositivos</li>
                <li>Geração de imagens HD</li>
              </ul>
              <Link to="/signup" className="mt-6 block text-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700">Assinar semestral</Link>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500">Anual</div>
              <div className="mt-1 text-2xl font-bold">R$999/ano</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>Acesso a todos os modelos de IA</li>
                <li>Histórico ilimitado</li>
                <li>Bots personalizados</li>
                <li>Sincronização em múltiplos dispositivos</li>
                <li>Geração de imagens HD</li>
              </ul>
              <Link to="/signup" className="mt-6 block text-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700">Assinar anual</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-8 text-xs text-gray-600">
          <div>Seu chat sincronizado em todos os dispositivos. Desktop, tablet ou celular.</div>
        </div>
      </footer>
    </div>
  )
}
