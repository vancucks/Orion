import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { Alertas } from "../pages/Alertas";
import { ClientesPrioritarios } from "../pages/ClientesPrioritarios";
import { ConsultaContrato } from "../pages/ConsultaContrato";
import { DashboardContratos } from "../pages/DashboardContratos";
import { DashboardExecutivo } from "../pages/DashboardExecutivo";
import { DashboardPagamentos } from "../pages/DashboardPagamentos";
import { DashboardRegional } from "../pages/DashboardRegional";
import { DashboardRisco } from "../pages/DashboardRisco";
import { HistoricoFinanceiro } from "../pages/HistoricoFinanceiro";
import { Login } from "../pages/Login";
import { RelatorioGerencial } from "../pages/RelatorioGerencial";
import { ValidacaoDados } from "../pages/ValidacaoDados";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard/executivo" element={<DashboardExecutivo />} />
        <Route path="/dashboard/risco" element={<DashboardRisco />} />
        <Route path="/dashboard/pagamentos" element={<DashboardPagamentos />} />
        <Route path="/dashboard/regional" element={<DashboardRegional />} />
        <Route path="/dashboard/contratos" element={<DashboardContratos />} />
        <Route path="/clientes-prioritarios" element={<ClientesPrioritarios />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/consulta-contrato" element={<ConsultaContrato />} />
        <Route path="/historico-financeiro" element={<HistoricoFinanceiro />} />
        <Route path="/relatorio-gerencial" element={<RelatorioGerencial />} />
        <Route path="/validacao-dados" element={<ValidacaoDados />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
