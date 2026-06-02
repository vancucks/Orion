import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { currency } from "../components/Formatters";
import { HistoricoFinanceiro as HistoricoFinanceiroType } from "../types";
import { useApi } from "../services/useApi";

export function HistoricoFinanceiro() {
  const contrato = "OR-1001";
  const { data, loading, error } = useApi<HistoricoFinanceiroType[]>(`/api/contratos/${contrato}/historico`);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orion-blue">Contrato em análise</p>
        <h2 className="mt-2 text-xl font-semibold text-orion-text">{contrato}</h2>
      </section>

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
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}
