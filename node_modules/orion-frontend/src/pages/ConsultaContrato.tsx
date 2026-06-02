import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { ErrorState } from "../components/ErrorState";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { RiskBadge } from "../components/RiskBadge";
import { currency, number } from "../components/Formatters";
import { ClientePrioritario } from "../types";
import { useApi } from "../services/useApi";

export function ConsultaContrato() {
  const [inputId, setInputId] = useState("OR-1001");
  const [contractId, setContractId] = useState("OR-1001");
  const { data, loading, error } = useApi<ClientePrioritario>(`/api/contratos/${contractId}`);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContractId(inputId.trim().toUpperCase());
  }

  return (
    <div className="space-y-6">
      <FilterBar filters={["regioes", "statusCobranca", "niveisRisco", "formasPagamento", "assessorias"]} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-orion-border bg-white p-4 shadow-soft sm:flex-row">
        <label className="flex-1 text-sm font-semibold text-slate-600">
          ID do contrato
          <input
            value={inputId}
            onChange={(event) => setInputId(event.target.value)}
            className="mt-2 w-full rounded-md border border-orion-border px-3 py-2 text-sm outline-none focus:border-orion-blue focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <button className="mt-auto inline-flex items-center justify-center gap-2 rounded-md bg-orion-blue px-4 py-2.5 font-semibold text-white" type="submit">
          <Search size={18} />
          Consultar
        </button>
      </form>

      {loading ? <LoadingState /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && data ? (
        <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-orion-text">Detalhes do contrato</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Detail label="ID do contrato" value={data.idContrato} />
            <Detail label="Cliente" value={data.cliente} />
            <Detail label="Região" value={data.regiao} />
            <Detail label="Assessoria" value={data.assessoria} />
            <Detail label="Dias em atraso" value={`${number.format(data.diasAtraso)} dias`} />
            <Detail label="Valor inadimplente" value={currency.format(data.valorInadimplente)} />
            <Detail label="Status da cobrança" value={data.statusCobranca} />
            <Detail label="Score interno de risco" value={String(data.scoreRisco)} />
            <Detail label="Nível de risco" value={<RiskBadge level={data.nivelRisco} />} />
            <Detail label="Forma de pagamento" value={data.formaPagamento} />
            <Detail label="Indicador de contemplação" value={data.indicadorContemplacao} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-orion-border bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-semibold text-orion-text">{value}</div>
    </div>
  );
}
