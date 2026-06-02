# ORION

Protótipo funcional de uma plataforma web de inteligência financeira para recuperação de crédito e prevenção da inadimplência.

## Tecnologias

- Frontend: React, TypeScript, Tailwind CSS, Vite e Recharts
- Backend: Node.js, Express e TypeScript
- Dados: mocks em arrays TypeScript
- Banco de dados: não utilizado
- Autenticação: apenas visual/simulada

## Estrutura

```txt
orion/
  frontend/
  backend/
  README.md
```

## Como instalar

Na raiz do projeto:

```bash
npm install
```

## Como rodar

Rodar backend e frontend juntos:

```bash
npm run dev
```

Ou separadamente:

```bash
npm run dev:backend
npm run dev:frontend
```

Endereços padrão:

- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:3333`

## Build

```bash
npm run build
```

## Endpoints da API local

- `GET /api/kpis`
- `GET /api/dashboard/executivo`
- `GET /api/dashboard/risco`
- `GET /api/dashboard/pagamentos`
- `GET /api/dashboard/regional`
- `GET /api/dashboard/contratos`
- `GET /api/clientes-prioritarios`
- `GET /api/alertas`
- `GET /api/contratos/:id`
- `GET /api/contratos/:id/historico`
- `GET /api/relatorios`

## Acesso

A tela de login é simulada. Ao clicar em **Entrar**, o usuário é direcionado ao Dashboard Executivo.

## Telas incluídas

- Login
- Dashboard Executivo
- Dashboard Analítico de Risco
- Dashboard de Pagamentos
- Dashboard Regional
- Dashboard Operacional de Contratos
- Clientes Prioritários
- Alertas
- Consulta de Contrato
- Histórico Financeiro
- Relatório Gerencial

## Observações

O sistema foi organizado para facilitar uma futura conexão com banco de dados real, mantendo controllers, rotas, serviços, tipos e componentes reutilizáveis separados.
