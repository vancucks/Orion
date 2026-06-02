import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  Map,
  Search,
  Users
} from "lucide-react";
import { Logo } from "../components/Logo";

const navItems = [
  { to: "/dashboard/executivo", label: "Dashboard Executivo", icon: LayoutDashboard },
  { to: "/dashboard/risco", label: "Risco", icon: Gauge },
  { to: "/dashboard/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/dashboard/regional", label: "Regional", icon: Map },
  { to: "/dashboard/contratos", label: "Contratos", icon: ClipboardList },
  { to: "/clientes-prioritarios", label: "Clientes Prioritários", icon: Users },
  { to: "/alertas", label: "Alertas", icon: AlertTriangle },
  { to: "/consulta-contrato", label: "Consulta de Contrato", icon: Search },
  { to: "/historico-financeiro", label: "Histórico Financeiro", icon: History },
  { to: "/relatorio-gerencial", label: "Relatório Gerencial", icon: FileText }
];

const titles: Record<string, string> = {
  "/dashboard/executivo": "Dashboard Executivo",
  "/dashboard/risco": "Dashboard Analítico de Risco",
  "/dashboard/pagamentos": "Dashboard de Pagamentos",
  "/dashboard/regional": "Dashboard Regional",
  "/dashboard/contratos": "Dashboard Operacional de Contratos",
  "/clientes-prioritarios": "Clientes Prioritários",
  "/alertas": "Alertas de Contratos Críticos",
  "/consulta-contrato": "Consulta de Contrato",
  "/historico-financeiro": "Histórico Financeiro",
  "/relatorio-gerencial": "Relatório Gerencial"
};

export function AppLayout() {
  const location = useLocation();
  const title = titles[location.pathname] ?? "ORION Analytics";

  return (
    <div className="min-h-screen bg-orion-light text-orion-text">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col bg-orion-navy text-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <Logo className="h-14 w-40 object-left" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-orion-blue text-white" : "text-blue-50 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-6 py-5 text-xs text-blue-100">
          Perfil ativo: Administrador/Gestor
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-orion-border bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-col justify-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orion-blue">Inteligência financeira</p>
                <h1 className="mt-1 text-2xl font-semibold text-orion-text">{title}</h1>
              </div>
              <div className="rounded-md border border-orion-border bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                Analista de Cobrança
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${isActive ? "bg-orion-navy text-white" : "bg-slate-100 text-slate-600"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
