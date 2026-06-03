import { Router } from "express";
import {
  getAlertas,
  getClientesPrioritarios,
  getContrato,
  getDashboardContratos,
  getDashboardExecutivo,
  getDashboardPagamentos,
  getDashboardRegional,
  getDashboardRisco,
  getFiltrosOpcoes,
  getHistoricoContrato,
  getInsights,
  getKpis,
  getRelatorios,
  getValidacaoDados
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/kpis", getKpis);
router.get("/filtros/opcoes", getFiltrosOpcoes);
router.get("/dashboard/executivo", getDashboardExecutivo);
router.get("/dashboard/risco", getDashboardRisco);
router.get("/dashboard/pagamentos", getDashboardPagamentos);
router.get("/dashboard/regional", getDashboardRegional);
router.get("/dashboard/contratos", getDashboardContratos);
router.get("/clientes-prioritarios", getClientesPrioritarios);
router.get("/alertas", getAlertas);
router.get("/contratos/:id", getContrato);
router.get("/contratos/:id/historico", getHistoricoContrato);
router.get("/insights", getInsights);
router.get("/validacao-dados", getValidacaoDados);
router.get("/relatorios", getRelatorios);

export default router;
