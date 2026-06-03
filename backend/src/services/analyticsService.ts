import { parse } from "csv-parse/sync";
import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

export type RiskLevel = "Baixo" | "Médio" | "Alto";

type RawCobranca = {
  ID_Contrato?: string | null;
  Nome_Assessoria?: string | null;
  Data_Envio_Assessoria?: string | Date | null;
  Dias_Em_Atraso_Inicial?: string | number | null;
  Valor_Inadimplente_Inicial?: string | number | null;
  Status_Cobranca?: string | null;
  Score_Interno_Risco?: string | number | null;
  Regiao_Cliente?: string | null;
};

type RawPagamento = {
  ID_Pagamento?: string | null;
  ID_Contrato?: string | null;
  Numero_Parcela?: string | number | null;
  Data_Vencimento?: string | Date | number | null;
  Data_Pagamento?: string | Date | number | null;
  Valor_Parcela?: string | number | null;
  Valor_Pago?: string | number | null;
  Forma_Pagamento?: string | null;
  Indicador_Contemplado?: string | null;
};

export type ContratoAnalitico = {
  idContrato: string;
  cliente: string;
  assessoria: string;
  dataEnvioAssessoria: string | null;
  diasAtraso: number;
  valorInadimplente: number;
  statusCobranca: string;
  scoreRisco: number;
  regiao: string;
  nivelRisco: RiskLevel;
  formaPagamento: string;
  indicadorContemplacao: string;
};

export type PagamentoAnalitico = {
  idPagamento: string;
  idContrato: string;
  parcela: number;
  vencimento: string | null;
  pagamento: string | null;
  valorParcela: number;
  valorPago: number;
  formaPagamento: string;
  indicadorContemplacao: string;
};

export type AnalyticsFilters = {
  regiao?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  risco?: string;
  formaPagamento?: string;
  assessoria?: string;
};

type PreviewRecord = Record<string, unknown>;

type ValidationData = {
  totalRegistrosCsv: number;
  totalRegistrosXlsx: number;
  primeirosRegistrosCsv: PreviewRecord[];
  primeirosRegistrosXlsx: PreviewRecord[];
};

type AnalyticsPayload = ReturnType<typeof buildAnalytics> & {
  validacaoDados: ValidationData;
};

type CacheEntry = {
  key: string;
  payload: AnalyticsPayload;
};

type SourceDataCache = {
  key: string;
  contratos: ContratoAnalitico[];
  pagamentos: PagamentoAnalitico[];
  rawCobrancas: RawCobranca[];
  rawPagamentos: RawPagamento[];
};

export class DataFileNotFoundError extends Error {
  code = "DATA_FILES_NOT_FOUND";

  constructor(files: string[]) {
    super(
      `Arquivos de dados não encontrados. Coloque cobranca_assessorias.csv e fluxo_pagamentos.xlsx em backend/data. Ausentes: ${files.join(", ")}.`
    );
  }
}

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");
const cobrancaPath = path.join(dataDir, "cobranca_assessorias.csv");
const pagamentosPath = path.join(dataDir, "fluxo_pagamentos.xlsx");
const analysisOutputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../analysis/output");
const analysisOutputPaths = {
  kpis: path.join(analysisOutputDir, "kpis.json"),
  dashboards: path.join(analysisOutputDir, "dashboards.json"),
  insights: path.join(analysisOutputDir, "insights.json"),
  validacaoDados: path.join(analysisOutputDir, "validacao_dados.json")
};

let cache: CacheEntry | null = null;
let sourceCache: SourceDataCache | null = null;

export async function getAnalytics(filters: AnalyticsFilters = {}) {
  const activeFilters = normalizeFilters(filters);
  const key = await getAnalyticsKey(activeFilters);

  if (cache?.key === key) {
    return cache.payload;
  }

  const generatedAnalytics = hasActiveFilters(activeFilters) ? null : await readGeneratedAnalytics();

  if (generatedAnalytics) {
    cache = { key, payload: generatedAnalytics };
    return generatedAnalytics;
  }

  const sourceData = await getSourceData();
  const { contratos, pagamentos } = applyAnalyticsFilters(sourceData.contratos, sourceData.pagamentos, activeFilters);

  const payload = {
    ...buildAnalytics(contratos, pagamentos),
    validacaoDados: {
      totalRegistrosCsv: sourceData.rawCobrancas.length,
      totalRegistrosXlsx: sourceData.rawPagamentos.length,
      primeirosRegistrosCsv: sourceData.rawCobrancas.slice(0, 20).map(normalizePreviewRecord),
      primeirosRegistrosXlsx: sourceData.rawPagamentos.slice(0, 20).map(normalizePreviewRecord)
    }
  };
  cache = { key, payload };

  return payload;
}

export async function getContratoAnalitico(idContrato: string, filters: AnalyticsFilters = {}) {
  const activeFilters = normalizeFilters(filters);
  const normalizedId = normalizeId(idContrato);
  const sourceData = await getSourceData();
  const { contratos } = applyAnalyticsFilters(sourceData.contratos, sourceData.pagamentos, activeFilters);

  return contratos.find((contrato) => contrato.idContrato === normalizedId) ?? null;
}

export async function getHistoricoFinanceiro(idContrato: string, filters: AnalyticsFilters = {}) {
  const activeFilters = normalizeFilters(filters);
  const normalizedId = normalizeId(idContrato);
  const sourceData = await getSourceData();
  const { pagamentos } = applyAnalyticsFilters(sourceData.contratos, sourceData.pagamentos, activeFilters);
  const contrato = await getContratoAnalitico(normalizedId, activeFilters);

  if (!contrato) {
    return [];
  }

  const historico = pagamentos
    .filter((pagamento) => pagamento.idContrato === normalizedId)
    .sort((a, b) => a.parcela - b.parcela || compareNullableDates(a.vencimento, b.vencimento));

  return historico.map((item) => ({
    parcela: item.parcela,
    vencimento: item.vencimento,
    pagamento: item.pagamento,
    valorParcela: item.valorParcela,
    valorPago: item.valorPago,
    formaPagamento: item.formaPagamento,
    indicadorContemplacao: item.indicadorContemplacao,
    situacao: getPaymentSituation(item)
  }));
}

export async function getFilterOptions() {
  const sourceData = await getSourceData();
  const dates = [
    ...sourceData.contratos.map((item) => item.dataEnvioAssessoria),
    ...sourceData.pagamentos.map((item) => item.pagamento ?? item.vencimento)
  ].filter((value): value is string => Boolean(value));

  return {
    regioes: uniqueSorted(sourceData.contratos.map((item) => item.regiao)),
    status: uniqueSorted(sourceData.contratos.map((item) => item.statusCobranca)),
    niveisRisco: uniqueSorted(sourceData.contratos.map((item) => item.nivelRisco)),
    formasPagamento: uniqueSorted(sourceData.pagamentos.map((item) => item.formaPagamento)),
    assessorias: uniqueSorted(sourceData.contratos.map((item) => item.assessoria)),
    menorData: dates.sort()[0] ?? null,
    maiorData: dates.sort().at(-1) ?? null
  };
}

async function getAnalyticsKey(filters: AnalyticsFilters) {
  if (hasActiveFilters(filters)) {
    return `filtered:${await getDataFilesKey()}:${JSON.stringify(filters)}`;
  }

  const generatedKey = await getGeneratedAnalyticsKey();

  if (generatedKey) {
    return `pandas:${generatedKey}`;
  }

  return `source:${await getDataFilesKey()}`;
}

async function getGeneratedAnalyticsKey() {
  const parts: string[] = [];

  for (const filePath of Object.values(analysisOutputPaths)) {
    try {
      const fileStat = await stat(filePath);
      parts.push(`${filePath}:${fileStat.mtimeMs}:${fileStat.size}`);
    } catch {
      return null;
    }
  }

  return parts.join("|");
}

async function readGeneratedAnalytics(): Promise<AnalyticsPayload | null> {
  const hasAllOutputs = await getGeneratedAnalyticsKey();

  if (!hasAllOutputs) {
    return null;
  }

  const [kpis, dashboards, insights, validacaoDados] = await Promise.all([
    readJson<Record<string, unknown>>(analysisOutputPaths.kpis),
    readJson<Record<string, unknown>>(analysisOutputPaths.dashboards),
    readJson<Record<string, unknown>>(analysisOutputPaths.insights),
    readJson<ValidationData>(analysisOutputPaths.validacaoDados)
  ]);

  return {
    ...dashboards,
    kpis: enrichStrategicKpis(kpis),
    insights,
    validacaoDados
  } as AnalyticsPayload;
}

async function readJson<T>(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function enrichStrategicKpis(kpis: Record<string, unknown>) {
  const taxaInadimplencia = getNumericKpi(kpis, "taxaInadimplencia", "inadimplencia");
  const recuperacaoCredito = getNumericKpi(kpis, "recuperacaoCredito", "taxaRecuperacao", "recuperacao");
  const contratosCriticos = getNumericKpi(kpis, "contratosCriticos") || getRiskLevelCount(kpis, "Alto");

  return {
    ...kpis,
    taxaInadimplencia,
    recuperacaoCredito,
    contratosCriticos
  };
}

function getNumericKpi(kpis: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = kpis[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function getRiskLevelCount(kpis: Record<string, unknown>, level: string) {
  const values = kpis.contratosPorNivelRisco;

  if (!Array.isArray(values)) {
    return 0;
  }

  const item = values.find((entry) => {
    if (typeof entry !== "object" || entry === null || !("nivel" in entry)) {
      return false;
    }

    return (entry as Record<string, unknown>).nivel === level;
  });

  if (item && typeof item === "object" && "quantidade" in item) {
    const quantidade = (item as Record<string, unknown>).quantidade;
    return typeof quantidade === "number" ? quantidade : 0;
  }

  return 0;
}

async function getSourceData() {
  const key = await getDataFilesKey();

  if (sourceCache?.key === key) {
    return sourceCache;
  }

  const rawCobrancas = await readCobrancas();
  const rawPagamentos = readPagamentos();
  const pagamentos = rawPagamentos.map(cleanPagamento).filter((pagamento): pagamento is PagamentoAnalitico => Boolean(pagamento));
  const latestPaymentByContract = getLatestPaymentByContract(pagamentos);
  const contratos = rawCobrancas
    .map((row) => cleanContrato(row, latestPaymentByContract.get(normalizeId(row.ID_Contrato))))
    .filter((contrato): contrato is ContratoAnalitico => Boolean(contrato));

  sourceCache = {
    key,
    contratos,
    pagamentos,
    rawCobrancas,
    rawPagamentos
  };

  return sourceCache;
}

function applyAnalyticsFilters(contratos: ContratoAnalitico[], pagamentos: PagamentoAnalitico[], filters: AnalyticsFilters) {
  const filteredContratos = contratos.filter((contrato) => contractMatchesFilters(contrato, filters));
  const filteredIds = new Set(filteredContratos.map((contrato) => contrato.idContrato));
  const filteredPagamentos = pagamentos.filter((pagamento) => paymentMatchesFilters(pagamento, filteredIds, filters));

  return {
    contratos: filteredContratos,
    pagamentos: filteredPagamentos
  };
}

function contractMatchesFilters(contrato: ContratoAnalitico, filters: AnalyticsFilters) {
  if (filters.regiao && contrato.regiao !== filters.regiao) {
    return false;
  }

  if (filters.status && contrato.statusCobranca !== filters.status) {
    return false;
  }

  if (filters.risco && contrato.nivelRisco !== filters.risco) {
    return false;
  }

  if (filters.formaPagamento && contrato.formaPagamento !== filters.formaPagamento) {
    return false;
  }

  if (filters.assessoria && contrato.assessoria !== filters.assessoria) {
    return false;
  }

  if (!dateMatchesFilters(contrato.dataEnvioAssessoria, filters)) {
    return false;
  }

  return true;
}

function paymentMatchesFilters(pagamento: PagamentoAnalitico, filteredIds: Set<string>, filters: AnalyticsFilters) {
  if (!filteredIds.has(pagamento.idContrato)) {
    return false;
  }

  if (filters.formaPagamento && pagamento.formaPagamento !== filters.formaPagamento) {
    return false;
  }

  return dateMatchesFilters(pagamento.pagamento ?? pagamento.vencimento, filters);
}

function dateMatchesFilters(date: string | null, filters: AnalyticsFilters) {
  if (!filters.dataInicio && !filters.dataFim) {
    return true;
  }

  if (!date) {
    return false;
  }

  if (filters.dataInicio && date < filters.dataInicio) {
    return false;
  }

  if (filters.dataFim && date > filters.dataFim) {
    return false;
  }

  return true;
}

function normalizeFilters(filters: AnalyticsFilters): AnalyticsFilters {
  return {
    regiao: normalizeFilterValue(filters.regiao),
    dataInicio: normalizeDateFilter(filters.dataInicio),
    dataFim: normalizeDateFilter(filters.dataFim),
    status: normalizeFilterValue(filters.status),
    risco: normalizeFilterValue(filters.risco),
    formaPagamento: normalizeFilterValue(filters.formaPagamento),
    assessoria: normalizeFilterValue(filters.assessoria)
  };
}

function normalizeFilterValue(value: string | undefined) {
  const text = normalizeText(value, "");

  if (!text || ["todos", "todas"].includes(removeDiacritics(text).toLowerCase())) {
    return undefined;
  }

  return text;
}

function normalizeDateFilter(value: string | undefined) {
  const date = toIsoDate(value);
  return date ?? undefined;
}

function hasActiveFilters(filters: AnalyticsFilters) {
  return Object.values(filters).some(Boolean);
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

async function getDataFilesKey() {
  const missing: string[] = [];
  const parts = await Promise.all(
    [cobrancaPath, pagamentosPath].map(async (filePath) => {
      try {
        const fileStat = await stat(filePath);
        return `${filePath}:${fileStat.mtimeMs}:${fileStat.size}`;
      } catch {
        missing.push(path.basename(filePath));
        return "";
      }
    })
  );

  if (missing.length > 0) {
    throw new DataFileNotFoundError(missing);
  }

  return parts.join("|");
}

async function readCobrancas() {
  const csv = await readFile(cobrancaPath, "utf8");
  return parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true
  }) as RawCobranca[];
}

function readPagamentos() {
  const workbook = XLSX.readFile(pagamentosPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<RawPagamento>(sheet, {
    defval: null,
    raw: false
  });
}

function cleanContrato(row: RawCobranca, latestPayment?: PagamentoAnalitico): ContratoAnalitico | null {
  const idContrato = normalizeId(row.ID_Contrato);

  if (!idContrato) {
    return null;
  }

  const diasAtraso = Math.min(3650, Math.max(0, Math.round(parseNumber(row.Dias_Em_Atraso_Inicial))));
  const valorInadimplente = parseMoney(row.Valor_Inadimplente_Inicial);
  const statusCobranca = normalizeStatus(row.Status_Cobranca);
  const scoreRisco = Math.max(0, Math.min(100, parseNumber(row.Score_Interno_Risco)));
  const regiao = normalizeRegion(row.Regiao_Cliente);
  const nivelRisco = classifyRisk(diasAtraso, statusCobranca, scoreRisco);

  return {
    idContrato,
    cliente: `Contrato ${idContrato}`,
    assessoria: normalizeText(row.Nome_Assessoria, "Assessoria não informada"),
    dataEnvioAssessoria: toIsoDate(row.Data_Envio_Assessoria),
    diasAtraso,
    valorInadimplente,
    statusCobranca,
    scoreRisco,
    regiao,
    nivelRisco,
    formaPagamento: latestPayment?.formaPagamento ?? "Não informado",
    indicadorContemplacao: latestPayment?.indicadorContemplacao ?? "Não informado"
  };
}

function cleanPagamento(row: RawPagamento): PagamentoAnalitico | null {
  const idPagamento = normalizeId(row.ID_Pagamento);
  const idContrato = normalizeId(row.ID_Contrato);

  if (!idPagamento || !idContrato) {
    return null;
  }

  return {
    idPagamento,
    idContrato,
    parcela: Math.max(0, Math.round(parseNumber(row.Numero_Parcela))),
    vencimento: toIsoDate(row.Data_Vencimento),
    pagamento: toIsoDate(row.Data_Pagamento),
    valorParcela: parseMoney(row.Valor_Parcela),
    valorPago: parseMoney(row.Valor_Pago),
    formaPagamento: normalizePaymentMethod(row.Forma_Pagamento),
    indicadorContemplacao: normalizeContemplado(row.Indicador_Contemplado)
  };
}

function buildAnalytics(contratos: ContratoAnalitico[], pagamentos: PagamentoAnalitico[]) {
  const totalPagamentos = pagamentos.length || 1;
  const valorTotalInadimplente = sumBy(contratos, (item) => item.valorInadimplente);
  const totalValorPago = sumBy(pagamentos, (item) => item.valorPago);
  const totalValorParcela = sumBy(pagamentos, (item) => item.valorParcela);
  const maxParcela = Math.max(0, ...pagamentos.map((item) => item.parcela));
  const cobrancaStatus = countToArray(contratos, (item) => item.statusCobranca, "status", "quantidade");
  const statusCounts = Object.fromEntries(cobrancaStatus.map((item) => [item.status, item.quantidade]));
  const regioes = buildRegioes(contratos);
  const formasPagamento = countToArray(pagamentos, (item) => item.formaPagamento, "forma", "quantidade").map((item) => ({
    forma: item.forma,
    percentual: round((item.quantidade / totalPagamentos) * 100, 1)
  }));
  const evolucaoPagamentos = buildEvolucaoPagamentos(pagamentos);
  const distribuicaoRisco = buildDistribuicaoRisco(contratos);
  const clientesPrioritarios = buildClientesPrioritarios(contratos);
  const alertas = buildAlertas(clientesPrioritarios);
  const assessorias = buildAssessorias(contratos);
  const tendenciaTemporal = buildTendenciaTemporal(evolucaoPagamentos);
  const patterns = buildPatterns({
    contratos,
    cobrancaStatus,
    formasPagamento,
    regioes,
    distribuicaoRisco,
    clientesPrioritarios
  });
  const insights = buildInsights({
    kpis: {
      valorTotalInadimplente,
      contratosEmAberto: statusCounts["Em Aberto"] ?? 0,
      atrasoMedio: averageBy(contratos, (item) => item.diasAtraso),
      taxaRecuperacao: totalValorParcela > 0 ? (totalValorPago / totalValorParcela) * 100 : 0,
      scoreMedioRisco: averageBy(contratos, (item) => item.scoreRisco),
      contratosInadimplentes: contratos.length,
      tendenciaTemporal
    },
    patterns
  });

  const kpis = {
    taxaInadimplencia: round(contratos.length > 0 ? (contratos.filter((item) => item.valorInadimplente > 0 || item.diasAtraso > 0).length / contratos.length) * 100 : 0),
    recuperacaoCredito: round(totalValorParcela > 0 ? (totalValorPago / totalValorParcela) * 100 : 0),
    valorTotalInadimplente: round(valorTotalInadimplente),
    contratosEmAberto: statusCounts["Em Aberto"] ?? 0,
    contratosCriticos: contratos.filter((item) => item.nivelRisco === "Alto").length,
    atrasoMedio: round(averageBy(contratos, (item) => item.diasAtraso)),
    taxaRecuperacao: round(totalValorParcela > 0 ? (totalValorPago / totalValorParcela) * 100 : 0),
    scoreMedioRisco: round(averageBy(contratos, (item) => item.scoreRisco)),
    contratosInadimplentes: contratos.length,
    tendenciaTemporal
  };

  return {
    kpis,
    cobrancaStatus,
    distribuicaoRisco,
    formasPagamento,
    regioes,
    evolucaoPagamentos,
    assessorias,
    clientesPrioritarios,
    alertas,
    pagamentosResumo: {
      totalRegistrados: pagamentos.length,
      maiorNumeroParcela: maxParcela,
      totalValorPago: round(totalValorPago),
      totalValorParcela: round(totalValorParcela)
    },
    relatorioGerencial: {
      indicadores: [
        { titulo: "Valor total em risco", valor: kpis.valorTotalInadimplente },
        { titulo: "Valor recuperado", valor: round(totalValorPago) },
        { titulo: "Efetividade de recuperação", valor: kpis.taxaRecuperacao, sufixo: "%" },
        { titulo: "Contratos críticos", valor: contratos.filter((item) => item.nivelRisco === "Alto").length }
      ],
      resumo: insights.diretoria[0]
    },
    insights,
    patterns,
    resumoCarga: {
      contratos: contratos.length,
      pagamentos: pagamentos.length,
      maxParcela,
      arquivos: {
        cobranca: cobrancaPath,
        pagamentos: pagamentosPath
      }
    }
  };
}

function getLatestPaymentByContract(pagamentos: PagamentoAnalitico[]) {
  const latest = new Map<string, PagamentoAnalitico>();

  for (const pagamento of pagamentos) {
    const current = latest.get(pagamento.idContrato);
    if (!current || getComparableDate(pagamento) > getComparableDate(current)) {
      latest.set(pagamento.idContrato, pagamento);
    }
  }

  return latest;
}

function buildRegioes(contratos: ContratoAnalitico[]) {
  const grouped = groupBy(contratos, (item) => item.regiao);

  return [...grouped.entries()]
    .map(([regiao, items]) => {
      const valorInadimplente = sumBy(items, (item) => item.valorInadimplente);
      return {
        regiao,
        contratos: items.length,
        valorInadimplente: round(valorInadimplente),
        exposicaoFinanceira: round(valorInadimplente),
        riscoAlto: items.filter((item) => item.nivelRisco === "Alto").length,
        percentualRiscoAlto: round((items.filter((item) => item.nivelRisco === "Alto").length / items.length) * 100, 1)
      };
    })
    .sort((a, b) => b.valorInadimplente - a.valorInadimplente);
}

function buildAssessorias(contratos: ContratoAnalitico[]) {
  return [...groupBy(contratos, (item) => item.assessoria).entries()]
    .map(([nome, items]) => ({
      nome,
      contratos: items.length,
      emAberto: items.filter((item) => item.statusCobranca === "Em Aberto").length
    }))
    .sort((a, b) => b.contratos - a.contratos)
    .slice(0, 5);
}

function buildClientesPrioritarios(contratos: ContratoAnalitico[]) {
  return contratos
    .filter((item) => item.nivelRisco === "Alto" || item.valorInadimplente > 0)
    .sort(
      (a, b) =>
        riskWeight(b.nivelRisco) - riskWeight(a.nivelRisco) ||
        b.diasAtraso - a.diasAtraso ||
        b.valorInadimplente - a.valorInadimplente ||
        b.scoreRisco - a.scoreRisco
    )
    .slice(0, 50);
}

function buildAlertas(clientesPrioritarios: ContratoAnalitico[]) {
  const today = new Date().toISOString().slice(0, 10);

  return clientesPrioritarios
    .filter((item) => item.nivelRisco === "Alto")
    .slice(0, 20)
    .map((item) => ({
      contrato: item.idContrato,
      cliente: item.cliente,
      motivo: buildAlertReason(item),
      diasAtraso: item.diasAtraso,
      data: today,
      nivelRisco: item.nivelRisco,
      status: item.statusCobranca === "Ajuizado" || item.diasAtraso > 120 || item.scoreRisco > 80 ? "Crítico" : "Atenção"
    }));
}

function buildHistoricos(pagamentos: PagamentoAnalitico[]) {
  const grouped = groupBy(pagamentos, (item) => item.idContrato);
  const historicos: Record<string, unknown[]> = {};

  for (const [idContrato, items] of grouped) {
    historicos[idContrato] = items
      .sort((a, b) => a.parcela - b.parcela || compareNullableDates(a.vencimento, b.vencimento))
      .map((item) => ({
        parcela: item.parcela,
        vencimento: item.vencimento,
        pagamento: item.pagamento,
        valorParcela: item.valorParcela,
        valorPago: item.valorPago,
        formaPagamento: item.formaPagamento,
        indicadorContemplacao: item.indicadorContemplacao,
        situacao: getPaymentSituation(item)
      }));
  }

  return historicos;
}

function buildDistribuicaoRisco(contratos: ContratoAnalitico[]) {
  const total = contratos.length || 1;
  const colors: Record<RiskLevel, string> = {
    Alto: "#dc2626",
    Médio: "#f97316",
    Baixo: "#16a34a"
  };

  return (["Alto", "Médio", "Baixo"] as RiskLevel[]).map((nivel) => ({
    nivel,
    percentual: round((contratos.filter((item) => item.nivelRisco === nivel).length / total) * 100, 1),
    cor: colors[nivel]
  }));
}

function buildEvolucaoPagamentos(pagamentos: PagamentoAnalitico[]) {
  const monthsByMonth = new Map<string, { mes: string; pagamentos: number; recuperado: number; sortKey: string }>();

  for (const pagamento of pagamentos) {
    if (!pagamento.pagamento || pagamento.valorPago <= 0) {
      continue;
    }

    const key = pagamento.pagamento.slice(0, 7);
    const current = monthsByMonth.get(key) ?? {
      mes: formatMonth(pagamento.pagamento),
      pagamentos: 0,
      recuperado: 0,
      sortKey: key
    };

    current.pagamentos += 1;
    current.recuperado += pagamento.valorPago;
    monthsByMonth.set(key, current);
  }

  return [...monthsByMonth.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-12)
    .map(({ sortKey: _sortKey, ...item }) => ({
      ...item,
      recuperado: round(item.recuperado)
    }));
}

function buildTendenciaTemporal(evolucaoPagamentos: { mes: string; pagamentos: number; recuperado: number }[]) {
  const previous = evolucaoPagamentos.at(-2);
  const current = evolucaoPagamentos.at(-1);

  if (!previous || !current || previous.recuperado === 0) {
    return {
      direcao: "estável",
      variacaoPercentual: 0,
      mesAtual: current?.mes ?? "Sem dados",
      mesAnterior: previous?.mes ?? "Sem dados"
    };
  }

  const variacaoPercentual = ((current.recuperado - previous.recuperado) / previous.recuperado) * 100;

  return {
    direcao: variacaoPercentual > 2 ? "alta" : variacaoPercentual < -2 ? "queda" : "estável",
    variacaoPercentual: round(variacaoPercentual, 1),
    mesAtual: current.mes,
    mesAnterior: previous.mes
  };
}

function buildPatterns(input: {
  contratos: ContratoAnalitico[];
  cobrancaStatus: { status: string; quantidade: number }[];
  formasPagamento: { forma: string; percentual: number }[];
  regioes: { regiao: string; contratos: number; valorInadimplente: number; exposicaoFinanceira: number; percentualRiscoAlto: number }[];
  distribuicaoRisco: { nivel: RiskLevel; percentual: number; cor: string }[];
  clientesPrioritarios: ContratoAnalitico[];
}) {
  const regiaoMaiorInadimplencia = input.regioes[0];
  const statusMaisFrequente = [...input.cobrancaStatus].sort((a, b) => b.quantidade - a.quantidade)[0];
  const formaPredominante = [...input.formasPagamento].sort((a, b) => b.percentual - a.percentual)[0];
  const concentracaoRiscoAlto = input.distribuicaoRisco.find((item) => item.nivel === "Alto");
  const regiaoMaiorRisco = [...input.regioes].sort((a, b) => b.percentualRiscoAlto - a.percentualRiscoAlto)[0];

  return {
    regioesMaiorInadimplencia: input.regioes.slice(0, 3).map((item) => item.regiao),
    regiaoMaiorInadimplencia: regiaoMaiorInadimplencia?.regiao ?? "Sem dados",
    statusMaisFrequente: statusMaisFrequente?.status ?? "Sem dados",
    formaPagamentoPredominante: formaPredominante?.forma ?? "Sem dados",
    contratosComMaiorAtraso: input.clientesPrioritarios.slice(0, 5).map((item) => ({
      idContrato: item.idContrato,
      diasAtraso: item.diasAtraso,
      valorInadimplente: item.valorInadimplente,
      nivelRisco: item.nivelRisco
    })),
    concentracaoRiscoAlto: concentracaoRiscoAlto?.percentual ?? 0,
    regiaoMaiorRisco: regiaoMaiorRisco?.regiao ?? "Sem dados"
  };
}

function buildInsights(input: {
  kpis: {
    valorTotalInadimplente: number;
    contratosEmAberto: number;
    atrasoMedio: number;
    taxaRecuperacao: number;
    scoreMedioRisco: number;
    contratosInadimplentes: number;
    tendenciaTemporal: { direcao: string; variacaoPercentual: number; mesAtual: string; mesAnterior: string };
  };
  patterns: ReturnType<typeof buildPatterns>;
}) {
  const { kpis, patterns } = input;

  return {
    diretoria: [
      `A carteira analisada reúne ${formatInteger(kpis.contratosInadimplentes)} contratos e ${formatCurrency(kpis.valorTotalInadimplente)} em valor inadimplente, com atraso médio de ${round(kpis.atrasoMedio, 1)} dias.`,
      `A tendência temporal de recuperação está em ${patternsText(kpis.tendenciaTemporal.direcao)}: ${kpis.tendenciaTemporal.variacaoPercentual}% entre ${kpis.tendenciaTemporal.mesAnterior} e ${kpis.tendenciaTemporal.mesAtual}.`,
      `${patterns.regiaoMaiorInadimplencia} lidera a exposição financeira e deve ser acompanhada na rotina executiva.`
    ],
    financeiro: [
      `A taxa de recuperação calculada sobre parcelas monitoradas é de ${round(kpis.taxaRecuperacao, 2)}%, com predominância de ${patterns.formaPagamentoPredominante}.`,
      `Contratos em aberto somam ${formatInteger(kpis.contratosEmAberto)} casos e devem orientar projeções de caixa e renegociação.`,
      `Os cinco maiores atrasos concentram prioridade financeira por combinar valor inadimplente, tempo em atraso e risco.`
    ],
    operacaoCobranca: [
      `${patterns.statusMaisFrequente} é o status mais frequente na cobrança, indicando onde a operação deve calibrar cadência e scripts.`,
      `A concentração de risco alto está em ${round(patterns.concentracaoRiscoAlto, 1)}% dos contratos; priorizar atrasos acima de 60 dias e ajuizados reduz dispersão operacional.`,
      `${patterns.regiaoMaiorRisco} apresenta maior concentração regional de risco alto e merece fila de acompanhamento específica.`
    ],
    padroes: patterns,
    geradoEm: new Date().toISOString()
  };
}

function classifyRisk(diasAtras: number, status: string, score: number): RiskLevel {
  if (diasAtras > 60 || status === "Ajuizado" || score > 70) {
    return "Alto";
  }

  if ((diasAtras >= 16 && diasAtras <= 60) || status === "Insucesso") {
    return "Médio";
  }

  return "Baixo";
}

function normalizeStatus(value: unknown) {
  const normalized = removeDiacritics(normalizeText(value, "Em Aberto")).toLowerCase();

  if (normalized.includes("ajuiz") || normalized.includes("judic")) {
    return "Ajuizado";
  }

  if (normalized.includes("insucesso") || normalized.includes("sem exito")) {
    return "Insucesso";
  }

  if (normalized.includes("acordo") || normalized.includes("negoci")) {
    return "Acordo Firmado";
  }

  return "Em Aberto";
}

function normalizeRegion(value: unknown) {
  const normalized = removeDiacritics(normalizeText(value, "Não informado")).toLowerCase();

  const regions: Record<string, string> = {
    norte: "Norte",
    nordeste: "Nordeste",
    sul: "Sul",
    sudeste: "Sudeste",
    "centro-oeste": "Centro-Oeste",
    centrooeste: "Centro-Oeste"
  };

  return regions[normalized.replace(/\s+/g, "").replace("centrooeste", "centro-oeste")] ?? titleCase(normalized || "Não informado");
}

function normalizePaymentMethod(value: unknown) {
  const text = removeDiacritics(normalizeText(value, "Não informado")).toLowerCase();

  if (text.includes("pix")) {
    return "Pix";
  }

  if (text.includes("debito")) {
    return "Débito Automático";
  }

  if (text.includes("boleto")) {
    return "Boleto";
  }

  return normalizeText(value, "Não informado");
}

function normalizeContemplado(value: unknown) {
  const text = removeDiacritics(normalizeText(value, "Não informado")).toLowerCase();

  if (text === "sim" || text === "s") {
    return "Contemplado";
  }

  if (text === "nao" || text === "não" || text === "n") {
    return "Não contemplado";
  }

  return "Não informado";
}

function normalizeId(value: unknown) {
  return normalizeText(value, "");
}

function normalizeText(value: unknown, fallback: string) {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).normalize("NFC").trim().replace(/\s+/g, " ");
  return text || fallback;
}

function normalizePreviewRecord<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, normalizePreviewValue(value)]));
}

function normalizePreviewValue(value: unknown) {
  if (value instanceof Date) {
    return toIsoDate(value);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return value;
}

function removeDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function titleCase(value: string) {
  return value
    .split(/(\s|-)/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = normalizeText(value, "0").replace(",", ".");
  const parsed = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = normalizeText(value, "0");

  if (text.includes(",")) {
    const parsed = Number(text.replace(/[R$\s.]/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(value: unknown) {
  const date = parseDateValue(value);
  return date ? date.toISOString().slice(0, 10) : null;
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  const text = normalizeText(value, "");
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  const brMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (brMatch) {
    return new Date(Date.UTC(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1])));
  }

  return null;
}

function getComparableDate(pagamento: PagamentoAnalitico) {
  return new Date(`${pagamento.pagamento ?? pagamento.vencimento ?? "1900-01-01"}T00:00:00Z`).getTime();
}

function compareNullableDates(a: string | null, b: string | null) {
  return new Date(`${a ?? "1900-01-01"}T00:00:00Z`).getTime() - new Date(`${b ?? "1900-01-01"}T00:00:00Z`).getTime();
}

function getPaymentSituation(pagamento: PagamentoAnalitico) {
  if (!pagamento.pagamento) {
    return "Em atraso";
  }

  if (!pagamento.vencimento) {
    return "Pago";
  }

  return compareNullableDates(pagamento.pagamento, pagamento.vencimento) > 0 ? "Pago com atraso" : "Pago";
}

function buildAlertReason(contrato: ContratoAnalitico) {
  if (contrato.statusCobranca === "Ajuizado") {
    return "Status ajuizado exige acompanhamento jurídico e financeiro";
  }

  if (contrato.diasAtraso > 120) {
    return "Atraso superior a 120 dias com exposição financeira elevada";
  }

  if (contrato.scoreRisco > 70) {
    return "Score interno de risco acima de 70";
  }

  return "Contrato classificado como alto risco";
}

function countToArray<T, K extends string, V extends string>(
  items: T[],
  getKey: (item: T) => string,
  keyName: K,
  valueName: V
): Array<Record<K, string> & Record<V, number>> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, value]) => ({ [keyName]: key, [valueName]: value }) as Record<K, string> & Record<V, number>)
    .sort((a, b) => Number(b[valueName]) - Number(a[valueName]));
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  }

  return grouped;
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function averageBy<T>(items: T[], getValue: (item: T) => number) {
  if (items.length === 0) {
    return 0;
  }

  return sumBy(items, getValue) / items.length;
}

function riskWeight(level: RiskLevel) {
  return level === "Alto" ? 3 : level === "Médio" ? 2 : 1;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
}

function formatMonth(isoDate: string) {
  const date = parseDateValue(isoDate);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  if (!date) {
    return "Sem data";
  }

  return `${months[date.getUTCMonth()]}/${String(date.getUTCFullYear()).slice(2)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function patternsText(value: string) {
  return value === "alta" ? "alta" : value === "queda" ? "queda" : "estável";
}
