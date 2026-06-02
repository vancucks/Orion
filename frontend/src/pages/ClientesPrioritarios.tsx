import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { currency, number } from "../components/Formatters";
import { ClientePrioritario } from "../types";
import { useApi } from "../services/useApi";

export function ClientesPrioritarios() {
  const { data, loading, error } = useApi<ClientePrioritario[]>("/api/clientes-prioritarios");

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "assessorias"]} />
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
    </div>
  );
}
