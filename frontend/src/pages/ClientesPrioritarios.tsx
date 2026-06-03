import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { currency, number } from "../components/Formatters";
import { ClientePrioritario } from "../types";
import { useFilteredPath } from "../contexts/FilterContext";
import { useApi } from "../services/useApi";

export function ClientesPrioritarios() {
  const path = useFilteredPath("/api/clientes-prioritarios");
  const { data, loading, error } = useApi<ClientePrioritario[]>(path);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />
      {data.length === 0 ? <EmptyState /> : null}
      {data.length > 0 ? (
      <DataTable
        data={data}
        columns={[
          { header: "ID do contrato", render: (item) => item.idContrato },
          { header: "Cliente", render: (item) => item.cliente },
          { header: "Região", render: (item) => item.regiao },
          { header: "Dias em atraso", render: (item) => number.format(item.diasAtraso) },
          { header: "Valor inadimplente", render: (item) => currency.format(item.valorInadimplente) },
          { header: "Status da cobrança", render: (item) => item.statusCobranca },
          { header: "Score de risco", render: (item) => item.scoreRisco },
          { header: "Nível de risco", render: (item) => <RiskBadge level={item.nivelRisco} /> }
        ]}
      />
      ) : null}
    </div>
  );
}
