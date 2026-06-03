import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, Clock, Percent, Wallet } from "lucide-react";
import { ChartCard } from "../components/ChartCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { currency, number, percent } from "../components/Formatters";
import { Kpis, RegionData, StatusData } from "../types";
import { useFilteredPath } from "../contexts/FilterContext";
import { useApi } from "../services/useApi";

type ExecutivoData = {
  kpis: Kpis;
  regioes: RegionData[];
  statusCobranca: StatusData[];
  resumo: string;
};

const statusColors = ["#1677ff", "#16a34a", "#f97316", "#dc2626"];

export function DashboardExecutivo() {
  const path = useFilteredPath("/api/dashboard/executivo");
  const { data, loading, error } = useApi<ExecutivoData>(path);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  if (data?.regioes.length === 0 && data.statusCobranca.length === 0) {
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Valor Total Inadimplente" value={currency.format(data.kpis.valorTotalInadimplente)} detail="Carteira consolidada" icon={<Wallet size={20} />} tone="red" />
        <KpiCard title="Contratos em Aberto" value={number.format(data.kpis.contratosEmAberto)} detail="Cobranças ativas" icon={<AlertCircle size={20} />} tone="orange" />
        <KpiCard title="Atraso Médio" value={`${data.kpis.atrasoMedio.toFixed(2)} dias`} detail="Média operacional" icon={<Clock size={20} />} tone="blue" />
        <KpiCard title="Taxa de Recuperação" value={percent(data.kpis.taxaRecuperacao)} detail="Indicador estratégico" icon={<Percent size={20} />} tone="green" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Contratos por região" subtitle="Quantidade monitorada por praça">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.regioes}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="regiao" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => number.format(Number(value))} />
              <Tooltip formatter={(value) => number.format(Number(value))} />
              <Bar dataKey="contratos" fill="#1677ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status de cobrança" subtitle="Distribuição da situação operacional">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.statusCobranca} dataKey="quantidade" nameKey="status" outerRadius={110} label>
                {data.statusCobranca.map((_, index) => (
                  <Cell key={index} fill={statusColors[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => number.format(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-orion-text">Resumo executivo</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{data.resumo}</p>
      </section>
    </div>
  );
}
