import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeDollarSign, Banknote, CalendarDays, FileCheck } from "lucide-react";
import { ChartCard } from "../components/ChartCard";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { currency, number } from "../components/Formatters";
import { PaymentMethod } from "../types";
import { useApi } from "../services/useApi";

type PagamentosData = {
  pagamentosRegistrados: number;
  formaMaisUtilizada: string;
  contratosEmAcordo: number;
  parcelasMonitoradas: string;
  formasPagamento: PaymentMethod[];
  evolucaoPagamentos: { mes: string; pagamentos: number; recuperado: number }[];
  resumo: string;
};

export function DashboardPagamentos() {
  const { data, loading, error } = useApi<PagamentosData>("/api/dashboard/pagamentos");

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <FilterBar filters={["periodos", "formasPagamento", "statusCobranca", "assessorias"]} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Pagamentos Registrados" value={number.format(data.pagamentosRegistrados)} detail="Base simulada" icon={<BadgeDollarSign size={20} />} tone="green" />
        <KpiCard title="Forma Mais Utilizada" value={data.formaMaisUtilizada} detail="50,1% dos pagamentos" icon={<Banknote size={20} />} tone="blue" />
        <KpiCard title="Contratos em Acordo" value={number.format(data.contratosEmAcordo)} detail="Acordo firmado" icon={<FileCheck size={20} />} tone="green" />
        <KpiCard title="Parcelas Monitoradas" value={data.parcelasMonitoradas} detail="Histórico por contrato" icon={<CalendarDays size={20} />} tone="neutral" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Formas de pagamento" subtitle="Participação percentual por modalidade">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.formasPagamento}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="forma" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Bar dataKey="percentual" fill="#1677ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolução mensal dos pagamentos" subtitle="Volume registrado no semestre">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.evolucaoPagamentos}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => number.format(Number(value))} />
              <Tooltip formatter={(value, name) => (name === "recuperado" ? currency.format(Number(value)) : number.format(Number(value)))} />
              <Area type="monotone" dataKey="pagamentos" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-orion-text">Resumo operacional</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{data.resumo}</p>
      </section>
    </div>
  );
}
