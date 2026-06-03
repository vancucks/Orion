import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { FilterKey, useFilters } from "../contexts/FilterContext";

type FilterBarProps = {
  filters: FilterKey[];
};

export function FilterBar({ filters }: FilterBarProps) {
  const { applyFilters, clearFilters, draftFilters, loadingOptions, options, optionsError, updateDraftFilter } = useFilters();

  return (
    <div className="rounded-lg border border-orion-border bg-white p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {filters.includes("regioes") ? (
          <SelectFilter label="Regiao" value={draftFilters.regiao} options={options.regioes} disabled={loadingOptions} onChange={(value) => updateDraftFilter("regiao", value)} />
        ) : null}

        {filters.includes("periodos") ? (
          <>
            <DateFilter label="Data inicial" value={draftFilters.dataInicio} min={options.menorData ?? undefined} max={options.maiorData ?? undefined} onChange={(value) => updateDraftFilter("dataInicio", value)} />
            <DateFilter label="Data final" value={draftFilters.dataFim} min={options.menorData ?? undefined} max={options.maiorData ?? undefined} onChange={(value) => updateDraftFilter("dataFim", value)} />
          </>
        ) : null}

        {filters.includes("statusCobranca") ? (
          <SelectFilter label="Status da cobranca" value={draftFilters.status} options={options.status} disabled={loadingOptions} onChange={(value) => updateDraftFilter("status", value)} />
        ) : null}

        {filters.includes("niveisRisco") ? (
          <SelectFilter label="Nivel de risco" value={draftFilters.risco} options={options.niveisRisco} disabled={loadingOptions} onChange={(value) => updateDraftFilter("risco", value)} />
        ) : null}

        {filters.includes("formasPagamento") ? (
          <SelectFilter
            label="Forma de pagamento"
            value={draftFilters.formaPagamento}
            options={options.formasPagamento}
            disabled={loadingOptions}
            onChange={(value) => updateDraftFilter("formaPagamento", value)}
          />
        ) : null}

        {filters.includes("assessorias") ? (
          <SelectFilter label="Assessoria" value={draftFilters.assessoria} options={options.assessorias} disabled={loadingOptions} onChange={(value) => updateDraftFilter("assessoria", value)} />
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500">{optionsError ? optionsError : loadingOptions ? "Carregando filtros..." : "Filtros compartilhados entre os dashboards."}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-orion-border bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Limpar filtros
          </button>
          <button type="button" onClick={applyFilters} className="inline-flex items-center justify-center gap-2 rounded-md bg-orion-blue px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <SlidersHorizontal size={16} />
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectFilter({ disabled, label, onChange, options, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-orion-border bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-orion-text outline-none focus:border-orion-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({ label, max, min, onChange, value }: { label: string; max?: string; min?: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-orion-border bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-orion-text outline-none focus:border-orion-blue focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
