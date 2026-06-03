# ORION

Protótipo funcional de uma plataforma web de inteligência financeira para recuperação de crédito e prevenção da inadimplência.

## Tecnologias

- Frontend: React, TypeScript, Tailwind CSS, Vite e Recharts
- Backend: Node.js, Express e TypeScript
- Análise de dados: Python, Pandas e openpyxl
- Dados: arquivos reais em CSV e XLSX processados para JSON
- Banco de dados: não utilizado
- Autenticação: apenas visual/simulada

## Dados reais

O fluxo de dados usa Pandas para ler os arquivos do diretório `backend/data` e gerar JSONs consumidos pelo backend Node/Express, sem Prisma, MySQL, PostgreSQL ou outro banco de dados.

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

O comando de análise gera estes arquivos:

```txt
backend/analysis/output/kpis.json
backend/analysis/output/dashboards.json
backend/analysis/output/insights.json
backend/analysis/output/validacao_dados.json
```

Se os JSONs ainda não existirem, o backend mantém compatibilidade e processa os arquivos de origem diretamente. Se os arquivos de dados estiverem ausentes, a API retorna erro `DATA_FILES_NOT_FOUND` informando o que precisa ser colocado em `backend/data`.

## Como instalar

Na raiz do projeto:

```bash
npm install
```

Instale também as dependências Python:

```bash
pip install pandas openpyxl
```

## Como rodar a análise

Com `cobranca_assessorias.csv` e `fluxo_pagamentos.xlsx` em `backend/data/`, execute:

```bash
npm run analyze
```

Esse comando executa:

```bash
python backend/analysis/orion_analysis.py
```

O script cria DataFrames com Pandas, limpa os dados, aplica análise exploratória, calcula KPIs, identifica padrões e exporta os JSONs em `backend/analysis/output/`.

## Como rodar

Depois de rodar a análise, inicie backend e frontend juntos:

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
- `GET /api/validacao-dados`
- `GET /api/relatorios`

## Processamento dos dados

Ao rodar `npm run analyze`, o script Python:

- converte valores monetários para número;
- padroniza datas para `YYYY-MM-DD`;
- trata nulos e registros sem identificador;
- normaliza regiões, assessorias, status de cobrança e formas de pagamento;
- classifica risco em baixo, médio e alto;
- remove duplicados e registros inconsistentes de dias em atraso;
- aplica `head()`, `info()`, `describe()`, `value_counts()`, `groupby()`, `sort_values()`, filtros booleanos, `isin()` e `merge()` por `ID_Contrato`;
- calcula inadimplência, recuperação, atraso médio, risco regional, tendência temporal, score médio de risco, pagamentos por mês e valor inadimplente por região;
- identifica padrões e gera insights para Diretoria, Financeiro e Operação de Cobrança.

Fluxo esperado:

```txt
1. Colocar CSV e XLSX em backend/data/
2. Rodar npm run analyze
3. Rodar npm run dev
4. O backend Node consome os JSONs gerados pelo Pandas
5. O frontend exibe os dados atualizados nos dashboards
```

## Acesso

A tela de login é simulada. Ao clicar em **Entrar**, o usuário é direcionado ao Dashboard Executivo.
