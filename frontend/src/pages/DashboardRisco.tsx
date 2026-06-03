import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, FileWarning, Handshake, XCircle } from "lucide-react";
import { ChartCard } from "../components/ChartCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { currency, number } from "../components/Formatters";
import { RegionData, RiskDistribution } from "../types";
import { useFilteredPath } from "../contexts/FilterContext";
import { useApi } from "../services/useApi";

type RiscoData = {
  scoreMedioRisco: number;
  contratosAjuizados: number;
  contratosComAcordo: number;
  contratosComInsucesso: number;
  distribuicaoRisco: RiskDistribution[];
  regioes: RegionData[];
  leituras: string[];
};

export function DashboardRisco() {
  const path = useFilteredPath("/api/dashboard/risco");
  const { data, loading, error } = useApi<RiscoData>(path);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  if (data?.regioes.length === 0) {
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
        <KpiCard title="Score Médio de Risco" value={data.scoreMedioRisco.toFixed(2)} detail="Escala interna de risco" icon={<AlertTriangle size={20} />} tone="orange" />
        <KpiCard title="Contratos Ajuizados" value={number.format(data.contratosAjuizados)} detail="Risco jurídico" icon={<FileWarning size={20} />} tone="red" />
        <KpiCard title="Contratos com Acordo" value={number.format(data.contratosComAcordo)} detail="Negociação ativa" icon={<Handshake size={20} />} tone="green" />
        <KpiCard title="Contratos com Insucesso" value={number.format(data.contratosComInsucesso)} detail="Sem recuperação recente" icon={<XCircle size={20} />} tone="red" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Distribuição do nível de risco" subtitle="Percentual da base por criticidade">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.distribuicaoRisco} dataKey="percentual" nameKey="nivel" innerRadius={55} outerRadius={110} label>
                {data.distribuicaoRisco.map((item) => (
                  <Cell key={item.nivel} fill={item.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Valor inadimplente por região" subtitle="Exposição financeira regional">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.regioes}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="regiao" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `R$ ${(Number(value) / 1000000).toFixed(0)} mi`} />
              <Tooltip formatter={(value) => currency.format(Number(value))} />
              <Bar dataKey="valorInadimplente" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {data.leituras.map((leitura) => (
          <div key={leitura} className="rounded-lg border border-orion-border bg-white p-5 text-sm leading-6 text-slate-600 shadow-soft">
            {leitura}
          </div>
        ))}
      </section>
    </div>
  );
}
