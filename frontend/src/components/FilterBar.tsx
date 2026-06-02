import { filterOptions } from "../data/filters";

type FilterKey = keyof typeof filterOptions;

type FilterBarProps = {
  filters: FilterKey[];
};

export function FilterBar({ filters }: FilterBarProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-orion-border bg-white p-4 shadow-soft md:grid-cols-3 xl:grid-cols-6">
      {filters.map((filter) => (
        <label key={filter} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {labelMap[filter]}
          <select className="mt-2 w-full rounded-md border border-orion-border bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-orion-text outline-none focus:border-orion-blue focus:ring-2 focus:ring-blue-100">
            {filterOptions[filter].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

const labelMap: Record<FilterKey, string> = {
  regioes: "Região",
  periodos: "Período",
  statusCobranca: "Status da cobrança",
  niveisRisco: "Nível de risco",
  formasPagamento: "Forma de pagamento",
  assessorias: "Assessoria",
  perfis: "Perfil"
};
