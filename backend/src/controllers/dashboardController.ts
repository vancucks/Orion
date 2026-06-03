import type { Request, Response } from "express";
import { DataFileNotFoundError, getAnalytics } from "../services/analyticsService.js";

type Analytics = Awaited<ReturnType<typeof getAnalytics>>;

export const getKpis = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => analytics.kpis);
};

export const getDashboardExecutivo = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => ({
    kpis: analytics.kpis,
    regioes: analytics.regioes,
    statusCobranca: analytics.cobrancaStatus,
    resumo: analytics.insights.diretoria[0],
    insights: analytics.insights.diretoria
  }));
};

export const getDashboardRisco = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => ({
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

export const getDashboardPagamentos = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => ({
    pagamentosRegistrados: analytics.pagamentos.length,
    formaMaisUtilizada: analytics.patterns.formaPagamentoPredominante,
    contratosEmAcordo: getStatusCount(analytics, "Acordo Firmado"),
    parcelasMonitoradas: `${getMaxParcela(analytics)} parcela(s)`,
    formasPagamento: analytics.formasPagamento,
    evolucaoPagamentos: analytics.evolucaoPagamentos,
    resumo: analytics.insights.financeiro[0],
    insights: analytics.insights.financeiro
  }));
};

export const getDashboardRegional = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => {
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

export const getDashboardContratos = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => ({
    statusCobranca: analytics.cobrancaStatus,
    topAssessoriasContratos: analytics.assessorias,
    topAssessoriasEmAberto: [...analytics.assessorias].sort((a, b) => b.emAberto - a.emAberto),
    contratosPrioritarios: analytics.clientesPrioritarios
  }));
};

export const getClientesPrioritarios = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => analytics.clientesPrioritarios);
};

export const getAlertas = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => analytics.alertas);
};

export const getContrato = async (req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => {
    const contrato = analytics.contratosPorId[req.params.id];

    if (!contrato) {
      res.status(404);
      return { message: "Contrato não encontrado" };
    }

    return contrato;
  });
};

export const getHistoricoContrato = async (req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => {
    const historico = analytics.historicosFinanceiros[req.params.id];

    if (!historico) {
      res.status(404);
      return { message: "Histórico financeiro não encontrado" };
    }

    return historico;
  });
};

export const getInsights = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => analytics.insights);
};

export const getValidacaoDados = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => ({
    ...analytics.validacaoDados,
    kpis: analytics.kpis
  }));
};

export const getRelatorios = async (_req: Request, res: Response) => {
  await sendAnalytics(res, (analytics) => analytics.relatorioGerencial);
};

async function sendAnalytics<T>(res: Response, select: (analytics: Analytics) => T) {
  try {
    const analytics = await getAnalytics();
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

function getMaxParcela(analytics: Analytics) {
  return Math.max(0, ...analytics.pagamentos.map((item) => item.parcela));
}
