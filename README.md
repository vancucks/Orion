# ORION

Protótipo funcional de uma plataforma web de inteligência financeira para recuperação de crédito e prevenção da inadimplência.

## Tecnologias

- Frontend: React, TypeScript, Tailwind CSS, Vite e Recharts
- Backend: Node.js, Express e TypeScript
- Dados: arquivos reais em CSV e XLSX
- Banco de dados: não utilizado
- Autenticação: apenas visual/simulada

## Dados reais

O backend lê os arquivos diretamente do diretório `backend/data`, sem Prisma, MySQL, PostgreSQL ou outro banco de dados.

Coloque os arquivos nestes caminhos:

```txt
backend/data/cobranca_assessorias.csv
backend/data/fluxo_pagamentos.xlsx
```

Colunas esperadas em `cobranca_assessorias.csv`:

- `ID_Contrato`
- `Nome_Assessoria`
- `Data_Envio_Assessoria`
- `Dias_Em_Atraso_Inicial`
- `Valor_Inadimplente_Inicial`
- `Status_Cobranca`
- `Score_Interno_Risco`
- `Regiao_Cliente`

Colunas esperadas em `fluxo_pagamentos.xlsx`:

- `ID_Pagamento`
- `ID_Contrato`
- `Numero_Parcela`
- `Data_Vencimento`
- `Data_Pagamento`
- `Valor_Parcela`
- `Valor_Pago`
- `Forma_Pagamento`
- `Indicador_Contemplado`

Se algum arquivo estiver ausente, a API retorna erro `DATA_FILES_NOT_FOUND` informando o que precisa ser colocado em `backend/data`.

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
- `GET /api/insights`
- `GET /api/relatorios`

## Processamento dos dados

Ao carregar os arquivos, o backend:

- converte valores monetários para número;
- padroniza datas para `YYYY-MM-DD`;
- trata nulos e registros sem identificador;
- normaliza regiões, assessorias, status de cobrança e formas de pagamento;
- classifica risco em baixo, médio e alto;
- calcula KPIs, análise regional, evolução mensal de pagamentos, clientes prioritários, alertas e insights textuais.

## Acesso

A tela de login é simulada. Ao clicar em **Entrar**, o usuário é direcionado ao Dashboard Executivo.
