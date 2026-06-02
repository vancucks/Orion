export const kpis = {
  valorTotalInadimplente: 62308840.8,
  contratosEmAberto: 4014,
  atrasoMedio: 113.94,
  taxaRecuperacao: 34.07,
  scoreMedioRisco: 50.76
};

export const cobrancaStatus = [
  { status: "Em Aberto", quantidade: 4014 },
  { status: "Acordo Firmado", quantidade: 3407 },
  { status: "Insucesso", quantidade: 1549 },
  { status: "Ajuizado", quantidade: 1030 }
];

export const distribuicaoRisco = [
  { nivel: "Alto", percentual: 89.1, cor: "#dc2626" },
  { nivel: "Médio", percentual: 10.2, cor: "#f97316" },
  { nivel: "Baixo", percentual: 0.7, cor: "#16a34a" }
];

export const formasPagamento = [
  { forma: "Boleto", percentual: 50.1 },
  { forma: "Pix", percentual: 34.9 },
  { forma: "Débito Automático", percentual: 15.0 }
];

export const regioes = [
  { regiao: "Nordeste", contratos: 3604, valorInadimplente: 22700000.0, exposicaoFinanceira: 22189407.46 },
  { regiao: "Sudeste", contratos: 2980, valorInadimplente: 21600000.0, exposicaoFinanceira: 21168200.22 },
  { regiao: "Sul", contratos: 1225, valorInadimplente: 9800000.0, exposicaoFinanceira: 9530200.11 },
  { regiao: "Centro-Oeste", contratos: 744, valorInadimplente: 5000000.0, exposicaoFinanceira: 4864000.0 },
  { regiao: "Norte", contratos: 451, valorInadimplente: 3100000.0, exposicaoFinanceira: 3048800.0 },
  { regiao: "Nacional Digital", contratos: 312, valorInadimplente: 1800000.0, exposicaoFinanceira: 1710200.0 },
  { regiao: "Carteira Especial", contratos: 188, valorInadimplente: 1308840.8, exposicaoFinanceira: 1244607.46 }
];

export const evolucaoPagamentos = [
  { mes: "Jan", pagamentos: 11200, recuperado: 3820000 },
  { mes: "Fev", pagamentos: 12600, recuperado: 4210000 },
  { mes: "Mar", pagamentos: 14100, recuperado: 4760000 },
  { mes: "Abr", pagamentos: 15800, recuperado: 5120000 },
  { mes: "Mai", pagamentos: 17100, recuperado: 5480000 },
  { mes: "Jun", pagamentos: 19200, recuperado: 6310000 }
];

export const assessorias = [
  { nome: "Atena Recovery", contratos: 1420, emAberto: 680 },
  { nome: "Nexus Cobrança", contratos: 1265, emAberto: 612 },
  { nome: "Alfa Crédito", contratos: 1098, emAberto: 544 },
  { nome: "Vetor Financeiro", contratos: 974, emAberto: 491 },
  { nome: "Boreal Gestão", contratos: 842, emAberto: 388 }
];

export const clientesPrioritarios = [
  { idContrato: "OR-1001", cliente: "Moura Participações Ltda.", regiao: "Nordeste", assessoria: "Atena Recovery", diasAtraso: 214, valorInadimplente: 894500.8, statusCobranca: "Ajuizado", scoreRisco: 88, nivelRisco: "Alto", formaPagamento: "Boleto", indicadorContemplacao: "Não contemplado" },
  { idContrato: "OR-1002", cliente: "Ferraz Comércio S.A.", regiao: "Sudeste", assessoria: "Nexus Cobrança", diasAtraso: 177, valorInadimplente: 721900.35, statusCobranca: "Em Aberto", scoreRisco: 82, nivelRisco: "Alto", formaPagamento: "Pix", indicadorContemplacao: "Contemplado" },
  { idContrato: "OR-1003", cliente: "Grupo Litoral Norte", regiao: "Nordeste", assessoria: "Alfa Crédito", diasAtraso: 149, valorInadimplente: 642100.0, statusCobranca: "Insucesso", scoreRisco: 74, nivelRisco: "Alto", formaPagamento: "Boleto", indicadorContemplacao: "Não contemplado" },
  { idContrato: "OR-1004", cliente: "Campos Energia ME", regiao: "Sul", assessoria: "Vetor Financeiro", diasAtraso: 63, valorInadimplente: 318740.5, statusCobranca: "Acordo Firmado", scoreRisco: 69, nivelRisco: "Alto", formaPagamento: "Débito Automático", indicadorContemplacao: "Contemplado" },
  { idContrato: "OR-1005", cliente: "Atlântico Serviços", regiao: "Centro-Oeste", assessoria: "Boreal Gestão", diasAtraso: 51, valorInadimplente: 190430.0, statusCobranca: "Insucesso", scoreRisco: 58, nivelRisco: "Médio", formaPagamento: "Pix", indicadorContemplacao: "Não contemplado" },
  { idContrato: "OR-1006", cliente: "Serra Azul Transportes", regiao: "Norte", assessoria: "Atena Recovery", diasAtraso: 13, valorInadimplente: 92320.1, statusCobranca: "Em Aberto", scoreRisco: 32, nivelRisco: "Baixo", formaPagamento: "Boleto", indicadorContemplacao: "Contemplado" }
];

export const alertas = [
  { contrato: "OR-1001", cliente: "Moura Participações Ltda.", motivo: "Atraso superior a 180 dias e status ajuizado", diasAtraso: 214, data: "2026-06-02", nivelRisco: "Alto", status: "Crítico" },
  { contrato: "OR-1002", cliente: "Ferraz Comércio S.A.", motivo: "Score de risco acima de 80", diasAtraso: 177, data: "2026-06-02", nivelRisco: "Alto", status: "Crítico" },
  { contrato: "OR-1003", cliente: "Grupo Litoral Norte", motivo: "Insucesso em cobrança com alto valor", diasAtraso: 149, data: "2026-06-01", nivelRisco: "Alto", status: "Crítico" },
  { contrato: "OR-1004", cliente: "Campos Energia ME", motivo: "Atraso acima de 60 dias", diasAtraso: 63, data: "2026-05-31", nivelRisco: "Alto", status: "Crítico" }
];

export const historicosFinanceiros: Record<string, unknown[]> = {
  "OR-1001": [
    { parcela: 55, vencimento: "2025-11-15", pagamento: null, valorParcela: 149083.47, valorPago: 0, formaPagamento: "Boleto", indicadorContemplacao: "Não contemplado", situacao: "Em atraso" },
    { parcela: 56, vencimento: "2025-12-15", pagamento: null, valorParcela: 149083.47, valorPago: 0, formaPagamento: "Boleto", indicadorContemplacao: "Não contemplado", situacao: "Em atraso" },
    { parcela: 57, vencimento: "2026-01-15", pagamento: null, valorParcela: 149083.47, valorPago: 0, formaPagamento: "Boleto", indicadorContemplacao: "Não contemplado", situacao: "Em atraso" },
    { parcela: 58, vencimento: "2026-02-15", pagamento: "2026-03-02", valorParcela: 149083.47, valorPago: 149083.47, formaPagamento: "Pix", indicadorContemplacao: "Não contemplado", situacao: "Pago com atraso" },
    { parcela: 59, vencimento: "2026-03-15", pagamento: null, valorParcela: 149083.47, valorPago: 0, formaPagamento: "Boleto", indicadorContemplacao: "Não contemplado", situacao: "Em atraso" },
    { parcela: 60, vencimento: "2026-04-15", pagamento: null, valorParcela: 149083.45, valorPago: 0, formaPagamento: "Boleto", indicadorContemplacao: "Não contemplado", situacao: "Em atraso" }
  ]
};

export const relatorioGerencial = {
  indicadores: [
    { titulo: "Valor total em risco", valor: 62308840.8 },
    { titulo: "Recuperado no semestre", valor: 29400000.0 },
    { titulo: "Efetividade de negociação", valor: 34.07, sufixo: "%" },
    { titulo: "Contratos críticos", valor: 3578 }
  ],
  resumo: "A carteira apresenta concentração relevante no Nordeste e Sudeste, com predominância de risco alto e maior uso de boleto. A recomendação gerencial é priorizar contratos acima de 60 dias, carteiras ajuizadas e clientes com score superior a 70."
};

export const contratos = Object.fromEntries(clientesPrioritarios.map((cliente) => [cliente.idContrato, cliente]));
