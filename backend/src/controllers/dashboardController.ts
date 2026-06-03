import type { Request, Response } from "express";
import {
  type AnalyticsFilters,
  DataFileNotFoundError,
  getAnalytics,
  getContratoAnalitico,
  getFilterOptions,
  getHistoricoFinanceiro
} from "../services/analyticsService.js";

type Analytics = Awaited<ReturnType<typeof getAnalytics>>;

export const getKpis = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => analytics.kpis);
};

export const getDashboardExecutivo = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => ({
    kpis: analytics.kpis,
    regioes: analytics.regioes,
    statusCobranca: analytics.cobrancaStatus,
    resumo: analytics.insights.diretoria[0],
    insights: analytics.insights.diretoria
  }));
};

export const getDashboardRisco = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => ({
    scoreMedioRisco: analytics.kpis.scoreMedioRisco,
    contratosAjuizados: getStatusCount(analytics, "Ajuizado"),
    contratosComAcordo: getStatusCount(analytics, "Acordo Firmado"),
    contratosComInsucesso: getStatusCount(analytics, "Insucesso"),
    distribuicaoRisco: analytics.distribuicaoRisco,
    regioes: analytics.regioes,
    riscoRegional: analytics.regioes.map((item) => ({
      regiao: item.regiao,
      percentualRiscoAlto: item.percentualRiscoAlto,
      riscoAlto: item.riscoAlto
    })),
    leituras: analytics.insights.operacaoCobranca
  }));
};

export const getDashboardPagamentos = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => ({
    pagamentosRegistrados: analytics.pagamentosResumo.totalRegistrados,
    formaMaisUtilizada: analytics.patterns.formaPagamentoPredominante,
    contratosEmAcordo: getStatusCount(analytics, "Acordo Firmado"),
    parcelasMonitoradas: `${analytics.pagamentosResumo.maiorNumeroParcela} parcela(s)`,
    formasPagamento: analytics.formasPagamento,
    evolucaoPagamentos: analytics.evolucaoPagamentos,
    resumo: analytics.insights.financeiro[0],
    insights: analytics.insights.financeiro
  }));
};

export const getDashboardRegional = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => {
    const regiaoMaisContratos = [...analytics.regioes].sort((a, b) => b.contratos - a.contratos)[0];
    const regiaoMaiorValor = [...analytics.regioes].sort((a, b) => b.valorInadimplente - a.valorInadimplente)[0];

    return {
      regiaoMaisContratos: regiaoMaisContratos ? `${regiaoMaisContratos.regiao} (${regiaoMaisContratos.contratos})` : "Sem dados",
      regiaoMaiorValor: regiaoMaiorValor?.regiao ?? "Sem dados",
      maiorExposicaoFinanceira: regiaoMaiorValor?.exposicaoFinanceira ?? 0,
      regioesMonitoradas: analytics.regioes.length,
      regioes: analytics.regioes,
      leitura: analytics.insights.diretoria[2]
    };
  });
};

export const getDashboardContratos = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => ({
    statusCobranca: analytics.cobrancaStatus,
    topAssessoriasContratos: analytics.assessorias,
    topAssessoriasEmAberto: [...analytics.assessorias].sort((a, b) => b.emAberto - a.emAberto),
    contratosPrioritarios: analytics.clientesPrioritarios
  }));
};

export const getClientesPrioritarios = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => analytics.clientesPrioritarios);
};

export const getAlertas = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => analytics.alertas);
};

export const getContrato = async (req: Request, res: Response) => {
  try {
    const contrato = await getContratoAnalitico(req.params.id, getFiltersFromRequest(req));

    if (!contrato) {
      res.status(404).json({ message: "Contrato nao encontrado" });
      return;
    }

    res.json(contrato);
  } catch (error) {
    handleAnalyticsError(error, res);
  }
};

export const getHistoricoContrato = async (req: Request, res: Response) => {
  try {
    const historico = await getHistoricoFinanceiro(req.params.id, getFiltersFromRequest(req));

    res.json(historico);
  } catch (error) {
    handleAnalyticsError(error, res);
  }
};

export const getInsights = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => analytics.insights);
};

export const getValidacaoDados = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => ({
    ...analytics.validacaoDados,
    kpis: analytics.kpis
  }));
};

export const getRelatorios = async (req: Request, res: Response) => {
  await sendAnalytics(req, res, (analytics) => analytics.relatorioGerencial);
};

export const getFiltrosOpcoes = async (_req: Request, res: Response) => {
  try {
    res.json(await getFilterOptions());
  } catch (error) {
    handleAnalyticsError(error, res);
  }
};

async function sendAnalytics<T>(req: Request, res: Response, select: (analytics: Analytics) => T) {
  try {
    const analytics = await getAnalytics(getFiltersFromRequest(req));
    res.json(select(analytics));
  } catch (error) {
    handleAnalyticsError(error, res);
  }
}

function handleAnalyticsError(error: unknown, res: Response) {
  if (error instanceof DataFileNotFoundError) {
    res.status(500).json({
      message: error.message,
      code: error.code
    });
    return;
  }

  console.error("Erro ao processar dados reais do ORION Analytics:", error);
  res.status(500).json({
    message: "Falha ao processar os arquivos reais do ORION Analytics.",
    code: "DATA_PROCESSING_ERROR"
  });
}

function getStatusCount(analytics: Analytics, status: string) {
  return analytics.cobrancaStatus.find((item) => item.status === status)?.quantidade ?? 0;
}

function getFiltersFromRequest(req: Request): AnalyticsFilters {
  return {
    regiao: getQueryParam(req, "regiao"),
    dataInicio: getQueryParam(req, "dataInicio"),
    dataFim: getQueryParam(req, "dataFim"),
    status: getQueryParam(req, "status"),
    risco: getQueryParam(req, "risco"),
    formaPagamento: getQueryParam(req, "formaPagamento"),
    assessoria: getQueryParam(req, "assessoria")
  };
}

function getQueryParam(req: Request, key: keyof AnalyticsFilters) {
  const value = req.query[key];

  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return value ? String(value) : undefined;
}
