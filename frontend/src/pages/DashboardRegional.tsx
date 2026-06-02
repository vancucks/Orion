import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building, Landmark, MapPinned, TrendingUp } from "lucide-react";
import { ChartCard } from "../components/ChartCard";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { currency, number } from "../components/Formatters";
import { RegionData } from "../types";
import { useApi } from "../services/useApi";

type RegionalData = {
  regiaoMaisContratos: string;
  regiaoMaiorValor: string;
  maiorExposicaoFinanceira: number;
  regioesMonitoradas: number;
  regioes: RegionData[];
  leitura: string;
};

export function DashboardRegional() {
  const { data, loading, error } = useApi<RegionalData>("/api/dashboard/regional");

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco"]} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Região com Mais Contratos" value={data.regiaoMaisContratos} detail="Maior concentração" icon={<MapPinned size={20} />} tone="blue" />
        <KpiCard title="Região com Maior Valor" value={data.regiaoMaiorValor} detail="Maior valor inadimplente" icon={<Landmark size={20} />} tone="red" />
        <KpiCard title="Maior Exposição Financeira" value={currency.format(data.maiorExposicaoFinanceira)} detail="Nordeste" icon={<TrendingUp size={20} />} tone="orange" />
        <KpiCard title="Regiões Monitoradas" value={number.format(data.regioesMonitoradas)} detail="Visão consolidada" icon={<Building size={20} />} tone="neutral" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Quantidade de contratos por região" subtitle="Nordeste lidera a carteira monitorada">
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

        <ChartCard title="Valor inadimplente por região" subtitle="Nordeste e Sudeste com maior exposição">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.regioes}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="regiao" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `R$ ${(Number(value) / 1000000).toFixed(0)} mi`} />
              <Tooltip formatter={(value) => currency.format(Number(value))} />
              <Bar dataKey="valorInadimplente" fill="#0b1f3a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-orion-text">Leitura regional</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{data.leitura}</p>
      </section>
    </div>
  );
}
