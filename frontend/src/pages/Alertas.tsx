import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { number } from "../components/Formatters";
import { Alerta } from "../types";
import { useFilteredPath } from "../contexts/FilterContext";
import { useApi } from "../services/useApi";

export function Alertas() {
  const path = useFilteredPath("/api/alertas");
  const { data, loading, error } = useApi<Alerta[]>(path);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Dados indisponíveis."} />;

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "periodos", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
        <h2 className="text-base font-semibold">Contratos críticos</h2>
        <p className="mt-2 text-sm">Alertas gerados a partir de atraso superior a 60 dias, status ajuizado, insucesso ou score de risco acima de 70.</p>
      </section>

      {data.length === 0 ? <EmptyState /> : null}
      {data.length > 0 ? (
      <DataTable
        data={data}
        columns={[
          { header: "Contrato", render: (item) => item.contrato },
          { header: "Cliente", render: (item) => item.cliente },
          { header: "Motivo", render: (item) => item.motivo },
          { header: "Dias em atraso", render: (item) => number.format(item.diasAtraso) },
          { header: "Data", render: (item) => new Date(`${item.data}T00:00:00`).toLocaleDateString("pt-BR") },
          { header: "Nível de risco", render: (item) => <RiskBadge level={item.nivelRisco} /> },
          { header: "Status", render: (item) => item.status }
        ]}
      />
      ) : null}
    </div>
  );
}
