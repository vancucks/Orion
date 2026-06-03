import { Database, FileSpreadsheet, Table2, Wallet, Clock, Percent, Gauge } from "lucide-react";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { currency, number } from "../components/Formatters";
import { useApi } from "../services/useApi";
import type { Kpis } from "../types";

type PreviewRecord = Record<string, string | number | null>;

type ValidacaoDadosData = {
  totalRegistrosCsv: number;
  totalRegistrosXlsx: number;
  primeirosRegistrosCsv: PreviewRecord[];
  primeirosRegistrosXlsx: PreviewRecord[];
  kpis: Kpis & {
    contratosInadimplentes?: number;
    tendenciaTemporal?: {
      direcao: string;
      variacaoPercentual: number;
      mesAtual: string;
      mesAnterior: string;
    };
  };
};

const csvColumns = [
  "ID_Contrato",
  "Nome_Assessoria",
  "Data_Envio_Assessoria",
  "Dias_Em_Atraso_Inicial",
  "Valor_Inadimplente_Inicial",
  "Status_Cobranca",
  "Score_Interno_Risco",
  "Regiao_Cliente"
];

const xlsxColumns = [
  "ID_Pagamento",
  "ID_Contrato",
  "Numero_Parcela",
  "Data_Vencimento",
  "Data_Pagamento",
  "Valor_Parcela",
  "Valor_Pago",
  "Forma_Pagamento",
  "Indicador_Contemplado"
];

export function ValidacaoDados() {
  const { data, loading, error } = useApi<ValidacaoDadosData>("/api/validacao-dados");

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <KpiCard
          title="Registros CSV"
          value={number.format(data.totalRegistrosCsv)}
          detail="cobranca_assessorias.csv"
          icon={<Table2 size={20} />}
          tone="blue"
        />
        <KpiCard
          title="Registros XLSX"
          value={number.format(data.totalRegistrosXlsx)}
          detail="fluxo_pagamentos.xlsx"
          icon={<FileSpreadsheet size={20} />}
          tone="green"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Inadimplência" value={currency.format(data.kpis.valorTotalInadimplente)} detail="Valor total carregado" icon={<Wallet size={20} />} tone="red" />
        <KpiCard title="Recuperação" value={`${data.kpis.taxaRecuperacao.toFixed(2)}%`} detail="Sobre parcelas monitoradas" icon={<Percent size={20} />} tone="green" />
        <KpiCard title="Atraso Médio" value={`${data.kpis.atrasoMedio.toFixed(2)} dias`} detail="Base de cobrança" icon={<Clock size={20} />} tone="orange" />
        <KpiCard title="Score Médio" value={data.kpis.scoreMedioRisco.toFixed(2)} detail="Risco interno" icon={<Gauge size={20} />} tone="blue" />
      </section>

      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Database size={18} className="text-orion-blue" />
          <h2 className="text-base font-semibold text-orion-text">Primeiros 20 registros do CSV</h2>
        </div>
        <DataTable data={data.primeirosRegistrosCsv} columns={buildColumns(csvColumns)} />
      </section>

      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Database size={18} className="text-orion-blue" />
          <h2 className="text-base font-semibold text-orion-text">Primeiros 20 registros do XLSX</h2>
        </div>
        <DataTable data={data.primeirosRegistrosXlsx} columns={buildColumns(xlsxColumns)} />
      </section>
    </div>
  );
}

function buildColumns(columns: string[]) {
  return columns.map((column) => ({
    header: column,
    render: (item: PreviewRecord) => formatCell(item[column])
  }));
}

function formatCell(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}
