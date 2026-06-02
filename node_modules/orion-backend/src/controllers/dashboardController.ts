import { Request, Response } from "express";
import {
  alertas,
  assessorias,
  clientesPrioritarios,
  cobrancaStatus,
  contratos,
  distribuicaoRisco,
  evolucaoPagamentos,
  formasPagamento,
  historicosFinanceiros,
  kpis,
  regioes,
  relatorioGerencial
} from "../data/mockData.js";

export const getKpis = (_req: Request, res: Response) => res.json(kpis);

export const getDashboardExecutivo = (_req: Request, res: Response) => {
  res.json({
    kpis,
    regioes,
    statusCobranca: cobrancaStatus,
    resumo: "A carteira inadimplente soma R$ 62,3 milhões, com maior concentração regional no Nordeste e recuperação média de 34,07%. A prioridade operacional deve permanecer nos contratos de maior atraso e exposição financeira."
  });
};

export const getDashboardRisco = (_req: Request, res: Response) => {
  res.json({
    scoreMedioRisco: kpis.scoreMedioRisco,
    contratosAjuizados: 1030,
    contratosComAcordo: 3407,
    contratosComInsucesso: 1549,
    distribuicaoRisco,
    regioes,
    leituras: [
      "89,1% da base monitorada está classificada em risco alto.",
      "Contratos ajuizados e casos com insucesso devem receber priorização analítica.",
      "Nordeste e Sudeste concentram a maior exposição financeira."
    ]
  });
};

export const getDashboardPagamentos = (_req: Request, res: Response) => {
  res.json({
    pagamentosRegistrados: 100000,
    formaMaisUtilizada: "Boleto",
    contratosEmAcordo: 3407,
    parcelasMonitoradas: "60 parcela(s)",
    formasPagamento,
    evolucaoPagamentos,
    resumo: "O boleto segue como principal forma de pagamento, seguido por Pix. A evolução mensal indica crescimento gradual do volume registrado e do valor recuperado."
  });
};

export const getDashboardRegional = (_req: Request, res: Response) => {
  res.json({
    regiaoMaisContratos: "Nordeste (3.604)",
    regiaoMaiorValor: "Nordeste",
    maiorExposicaoFinanceira: 22189407.46,
    regioesMonitoradas: 7,
    regioes,
    leitura: "O Nordeste lidera em quantidade de contratos e exposição financeira. Nordeste e Sudeste devem ser acompanhados como regiões críticas para recuperação de crédito."
  });
};

export const getDashboardContratos = (_req: Request, res: Response) => {
  res.json({
    statusCobranca: cobrancaStatus,
    topAssessoriasContratos: assessorias,
    topAssessoriasEmAberto: [...assessorias].sort((a, b) => b.emAberto - a.emAberto),
    contratosPrioritarios: clientesPrioritarios
  });
};

export const getClientesPrioritarios = (_req: Request, res: Response) => res.json(clientesPrioritarios);

export const getAlertas = (_req: Request, res: Response) => res.json(alertas);

export const getContrato = (req: Request, res: Response) => {
  const contrato = contratos[req.params.id];

  if (!contrato) {
    res.status(404).json({ message: "Contrato não encontrado" });
    return;
  }

  res.json(contrato);
};

export const getHistoricoContrato = (req: Request, res: Response) => {
  const historico = historicosFinanceiros[req.params.id];

  if (!historico) {
    res.status(404).json({ message: "Histórico financeiro não encontrado" });
    return;
  }

  res.json(historico);
};

export const getRelatorios = (_req: Request, res: Response) => res.json(relatorioGerencial);
