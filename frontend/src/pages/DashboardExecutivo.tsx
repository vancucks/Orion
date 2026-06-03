import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, Clock, Gauge, MinusCircle, Percent, ShieldAlert, TrendingDown, TrendingUp, Wallet } from "lucide-react";
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
  if (error || !data) return <ErrorState message={error ?? "Dados indisponiveis."} />;

  if (data.regioes.length === 0 && data.statusCobranca.length === 0) {
    return (
      <div className="space-y-6">
        <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />
        <EmptyState />
      </div>
    );
  }

  const tendencia = data.kpis.tendenciaTemporal;
  const TrendIcon = tendencia?.direcao === "alta" ? TrendingUp : tendencia?.direcao === "queda" ? TrendingDown : MinusCircle;

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Taxa de Inadimplência"
          value={percent(data.kpis.taxaInadimplencia)}
          detail="Percentual de contratos em atraso ou inadimplência"
          icon={<AlertTriangle size={20} />}
          tone={data.kpis.taxaInadimplencia >= 50 ? "red" : data.kpis.taxaInadimplencia >= 20 ? "orange" : "green"}
        />
        <KpiCard title="Valor Total Inadimplente" value={currency.format(data.kpis.valorTotalInadimplente)} detail="Soma dos valores inadimplentes da carteira" icon={<Wallet size={20} />} tone="red" />
        <KpiCard
          title="Recuperação de Crédito"
          value={percent(data.kpis.recuperacaoCredito)}
          detail="Efetividade das ações de cobrança"
          icon={<Percent size={20} />}
          tone={data.kpis.recuperacaoCredito >= 70 ? "green" : data.kpis.recuperacaoCredito >= 40 ? "orange" : "red"}
        />
        <KpiCard title="Atraso Médio" value={`${data.kpis.atrasoMedio.toFixed(2)} dias`} detail="Média de dias em atraso dos contratos" icon={<Clock size={20} />} tone={data.kpis.atrasoMedio > 60 ? "red" : "orange"} />
        <KpiCard title="Contratos Críticos" value={number.format(data.kpis.contratosCriticos)} detail="Contratos classificados como alto risco" icon={<ShieldAlert size={20} />} tone={data.kpis.contratosCriticos > 0 ? "red" : "green"} />
        <KpiCard title="Score Médio de Risco" value={data.kpis.scoreMedioRisco.toFixed(2)} detail="Média geral do score de risco da carteira" icon={<Gauge size={20} />} tone={data.kpis.scoreMedioRisco > 70 ? "red" : data.kpis.scoreMedioRisco > 40 ? "orange" : "green"} />
        <KpiCard
          title="Tendência Temporal"
          value={formatTrend(tendencia)}
          detail={tendencia ? `Entre ${tendencia.mesAnterior} e ${tendencia.mesAtual}` : "Evolução temporal indisponível"}
          icon={<TrendIcon size={20} />}
          tone={tendencia?.direcao === "alta" ? "green" : tendencia?.direcao === "queda" ? "red" : "neutral"}
        />
        <KpiCard title="Contratos em Aberto" value={number.format(data.kpis.contratosEmAberto)} detail="Cobranças ativas na visão filtrada" icon={<Activity size={20} />} tone="blue" />
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

function formatTrend(tendencia: Kpis["tendenciaTemporal"]) {
  if (!tendencia) {
    return "Sem dados";
  }

  const direction = tendencia.direcao === "alta" ? "Alta" : tendencia.direcao === "queda" ? "Queda" : "Estável";
  return `${direction} ${Math.abs(tendencia.variacaoPercentual).toFixed(1)}%`;
}
