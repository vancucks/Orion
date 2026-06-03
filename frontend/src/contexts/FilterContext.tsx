import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { apiGet } from "../services/api";

export type FilterKey = "regioes" | "periodos" | "statusCobranca" | "niveisRisco" | "formasPagamento" | "assessorias";

export type FilterState = {
  regiao: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  risco: string;
  formaPagamento: string;
  assessoria: string;
};

type FilterOptions = {
  regioes: string[];
  status: string[];
  niveisRisco: string[];
  formasPagamento: string[];
  assessorias: string[];
  menorData: string | null;
  maiorData: string | null;
};

type FilterContextValue = {
  appliedFilters: FilterState;
  draftFilters: FilterState;
  options: FilterOptions;
  loadingOptions: boolean;
  optionsError: string | null;
  updateDraftFilter: (key: keyof FilterState, value: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  buildFilteredPath: (path: string) => string;
};

const emptyFilters: FilterState = {
  regiao: "",
  dataInicio: "",
  dataFim: "",
  status: "",
  risco: "",
  formaPagamento: "",
  assessoria: ""
};

const emptyOptions: FilterOptions = {
  regioes: [],
  status: [],
  niveisRisco: [],
  formasPagamento: [],
  assessorias: [],
  menorData: null,
  maiorData: null
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);
  const [options, setOptions] = useState<FilterOptions>(emptyOptions);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoadingOptions(true);
    setOptionsError(null);

    apiGet<FilterOptions>("/api/filtros/opcoes")
      .then((response) => {
        if (active) setOptions(response);
      })
      .catch((error: Error) => {
        if (active) setOptionsError(error.message);
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<FilterContextValue>(
    () => ({
      appliedFilters,
      draftFilters,
      options,
      loadingOptions,
      optionsError,
      updateDraftFilter: (key, value) => {
        setDraftFilters((current) => ({ ...current, [key]: value }));
      },
      applyFilters: () => {
        setAppliedFilters(draftFilters);
      },
      clearFilters: () => {
        setDraftFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
      },
      buildFilteredPath: (path) => {
        const params = new URLSearchParams();
        const queryMap: Array<[keyof FilterState, string]> = [
          ["regiao", "regiao"],
          ["dataInicio", "dataInicio"],
          ["dataFim", "dataFim"],
          ["status", "status"],
          ["risco", "risco"],
          ["formaPagamento", "formaPagamento"],
          ["assessoria", "assessoria"]
        ];

        queryMap.forEach(([stateKey, queryKey]) => {
          const value = appliedFilters[stateKey];
          if (value) params.set(queryKey, value);
        });

        const query = params.toString();
        return query ? `${path}?${query}` : path;
      }
    }),
    [appliedFilters, draftFilters, loadingOptions, options, optionsError]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error("useFilters deve ser usado dentro de FilterProvider.");
  }

  return context;
}

export function useFilteredPath(path: string) {
  return useFilters().buildFilteredPath(path);
}
