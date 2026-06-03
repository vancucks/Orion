import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { currency } from "../components/Formatters";
import { HistoricoFinanceiro as HistoricoFinanceiroType } from "../types";
import { useFilteredPath } from "../contexts/FilterContext";
import { useApi } from "../services/useApi";

export function HistoricoFinanceiro() {
  const contrato = "CONTR_2026_00001";
  const path = useFilteredPath(`/api/contratos/${contrato}/historico`);
  const { data, loading, error } = useApi<HistoricoFinanceiroType[]>(path);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />
      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orion-blue">Contrato em análise</p>
        <h2 className="mt-2 text-xl font-semibold text-orion-text">{contrato}</h2>
      </section>

      {data.length === 0 ? <EmptyState /> : null}
      {data.length > 0 ? (
      <DataTable
        data={data}
        columns={[
          { header: "Número da parcela", render: (item) => item.parcela },
          { header: "Data de vencimento", render: (item) => formatDate(item.vencimento) },
          { header: "Data de pagamento", render: (item) => (item.pagamento ? formatDate(item.pagamento) : "Pendente") },
          { header: "Valor da parcela", render: (item) => currency.format(item.valorParcela) },
          { header: "Valor pago", render: (item) => currency.format(item.valorPago) },
          { header: "Forma de pagamento", render: (item) => item.formaPagamento },
          { header: "Indicador de contemplação", render: (item) => item.indicadorContemplacao },
          { header: "Situação", render: (item) => item.situacao }
        ]}
      />
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}
