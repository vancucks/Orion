import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, FileCheck, Scale, XCircle } from "lucide-react";
import { ChartCard } from "../components/ChartCard";
import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { currency, number } from "../components/Formatters";
import { ClientePrioritario, StatusData } from "../types";
import { useFilteredPath } from "../contexts/FilterContext";
import { useApi } from "../services/useApi";

type Assessoria = {
  nome: string;
  contratos: number;
  emAberto: number;
};

type ContratosData = {
  statusCobranca: StatusData[];
  topAssessoriasContratos: Assessoria[];
  topAssessoriasEmAberto: Assessoria[];
  contratosPrioritarios: ClientePrioritario[];
};

export function DashboardContratos() {
  const path = useFilteredPath("/api/dashboard/contratos");
  const { data, loading, error } = useApi<ContratosData>(path);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  if (data.statusCobranca.length === 0 && data.contratosPrioritarios.length === 0) {
    return (
      <div className="space-y-6">
        <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />
        <EmptyState />
      </div>
    );
  }

  const status = Object.fromEntries(data.statusCobranca.map((item) => [item.status, item.quantidade]));

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Em Aberto" value={number.format(status["Em Aberto"] ?? 0)} detail="Contratos sem resolução" icon={<AlertCircle size={20} />} tone="orange" />
        <KpiCard title="Acordo Firmado" value={number.format(status["Acordo Firmado"] ?? 0)} detail="Negociações formalizadas" icon={<FileCheck size={20} />} tone="green" />
        <KpiCard title="Insucesso" value={number.format(status["Insucesso"] ?? 0)} detail="Cobranças sem êxito" icon={<XCircle size={20} />} tone="red" />
        <KpiCard title="Ajuizado" value={number.format(status["Ajuizado"] ?? 0)} detail="Contratos em via jurídica" icon={<Scale size={20} />} tone="red" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Top 5 assessorias por contratos" subtitle="Volume total sob acompanhamento">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topAssessoriasContratos}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => number.format(Number(value))} />
              <Bar dataKey="contratos" fill="#1677ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 assessorias com casos em aberto" subtitle="Carteiras que exigem maior atenção">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topAssessoriasEmAberto}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => number.format(Number(value))} />
              <Bar dataKey="emAberto" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-orion-text">Contratos prioritários por atraso</h2>
        <DataTable
          data={[...data.contratosPrioritarios].sort((a, b) => b.diasAtraso - a.diasAtraso)}
          columns={[
            { header: "Contrato", render: (item) => item.idContrato },
            { header: "Cliente", render: (item) => item.cliente },
            { header: "Região", render: (item) => item.regiao },
            { header: "Dias em atraso", render: (item) => number.format(item.diasAtraso) },
            { header: "Valor inadimplente", render: (item) => currency.format(item.valorInadimplente) },
            { header: "Status", render: (item) => item.statusCobranca },
            { header: "Risco", render: (item) => <RiskBadge level={item.nivelRisco} /> }
          ]}
        />
      </section>
    </div>
  );
}

