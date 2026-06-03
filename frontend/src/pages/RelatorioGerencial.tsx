import { Download, LineChart, ShieldAlert, Target, Wallet } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { currency, number } from "../components/Formatters";
import { useFilteredPath } from "../contexts/FilterContext";
import { useApi } from "../services/useApi";

type RelatorioData = {
  indicadores: { titulo: string; valor: number; sufixo?: string }[];
  resumo: string;
};

const icons = [Wallet, LineChart, Target, ShieldAlert];

export function RelatorioGerencial() {
  const path = useFilteredPath("/api/relatorios");
  const { data, loading, error } = useApi<RelatorioData>(path);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  if (data.indicadores.every((item) => item.valor === 0)) {
    return (
      <div className="space-y-6">
        <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />

      <section className="flex flex-col justify-between gap-4 rounded-lg border border-orion-border bg-white p-5 shadow-soft sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-orion-text">Relatório financeiro estratégico</h2>
          <p className="mt-1 text-sm text-slate-500">Visão consolidada para apresentação gerencial.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-orion-blue bg-blue-50 px-4 py-2.5 font-semibold text-orion-blue">
          <Download size={18} />
          Exportar PDF
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.indicadores.map((item, index) => {
          const Icon = icons[index] ?? Wallet;
          const value = item.sufixo === "%" ? `${item.valor.toFixed(2)}%` : item.valor > 100000 ? currency.format(item.valor) : number.format(item.valor);
          return <KpiCard key={item.titulo} title={item.titulo} value={value} detail="Indicador financeiro estratégico" icon={<Icon size={20} />} tone={index === 3 ? "red" : "blue"} />;
        })}
      </section>

      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-orion-text">Resumo financeiro</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{data.resumo}</p>
      </section>
    </div>
  );
}
