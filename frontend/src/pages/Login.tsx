import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { Logo } from "../components/Logo";

export function Login() {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/dashboard/executivo");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-orion-navy px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-orion-navy p-8 text-white lg:p-10">
          <div className="flex items-center gap-3">
            <Logo className="mx-auto h-32 w-[22rem] max-w-full object-center" />
          </div>
          <div className="mt-20 max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Inteligência financeira</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">Recuperação de crédito e prevenção da inadimplência.</h1>
            <p className="mt-5 text-base leading-7 text-blue-100">
              Protótipo corporativo para leitura de risco, acompanhamento de pagamentos, contratos críticos e relatórios gerenciais.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 lg:p-10">
          <h2 className="text-2xl font-semibold text-orion-text">Acesso simulado</h2>
          <p className="mt-2 text-sm text-slate-500">Informe login e senha para acessar o Dashboard Executivo.</p>

          <label className="mt-8 block text-sm font-semibold text-slate-600">
            Login
            <div className="mt-2 flex items-center gap-2 rounded-md border border-orion-border px-3 py-2.5 focus-within:border-orion-blue focus-within:ring-2 focus-within:ring-blue-100">
              <User size={18} className="text-slate-400" />
              <input className="w-full border-0 outline-none" placeholder="administrador@orion" type="text" />
            </div>
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-600">
            Senha
            <div className="mt-2 flex items-center gap-2 rounded-md border border-orion-border px-3 py-2.5 focus-within:border-orion-blue focus-within:ring-2 focus-within:ring-blue-100">
              <Lock size={18} className="text-slate-400" />
              <input className="w-full border-0 outline-none" placeholder="senha simulada" type="password" />
            </div>
          </label>

          <button className="mt-8 w-full rounded-md bg-orion-blue px-4 py-3 font-semibold text-white transition hover:bg-blue-600" type="submit">
            Entrar
          </button>

          <div className="mt-8 rounded-lg border border-orion-border bg-slate-50 p-4 text-sm text-slate-600">
            Perfis visuais disponíveis: Administrador/Gestor e Analista de Cobrança.
          </div>
        </form>
      </section>
    </main>
  );
}
