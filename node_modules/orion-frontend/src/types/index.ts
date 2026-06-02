export type RiskLevel = "Baixo" | "Médio" | "Alto";

export type Kpis = {
  valorTotalInadimplente: number;
  contratosEmAberto: number;
  atrasoMedio: number;
  taxaRecuperacao: number;
  scoreMedioRisco: number;
};

export type RegionData = {
  regiao: string;
  contratos: number;
  valorInadimplente: number;
  exposicaoFinanceira: number;
};

export type StatusData = {
  status: string;
  quantidade: number;
};

export type RiskDistribution = {
  nivel: RiskLevel;
  percentual: number;
  cor: string;
};

export type PaymentMethod = {
  forma: string;
  percentual: number;
};

export type ClientePrioritario = {
  idContrato: string;
  cliente: string;
  regiao: string;
  assessoria: string;
  diasAtraso: number;
  valorInadimplente: number;
  statusCobranca: string;
  scoreRisco: number;
  nivelRisco: RiskLevel;
  formaPagamento: string;
  indicadorContemplacao: string;
};

export type Alerta = {
  contrato: string;
  cliente: string;
  motivo: string;
  diasAtraso: number;
  data: string;
  nivelRisco: RiskLevel;
  status: string;
};

export type HistoricoFinanceiro = {
  parcela: number;
  vencimento: string;
  pagamento: string | null;
  valorParcela: number;
  valorPago: number;
  formaPagamento: string;
  indicadorContemplacao: string;
  situacao: string;
};
