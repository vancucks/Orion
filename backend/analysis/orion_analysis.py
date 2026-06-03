from __future__ import annotations

import io
import json
import math
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd


BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "data"
OUTPUT_DIR = Path(__file__).resolve().parent / "output"

COBRANCA_PATH = DATA_DIR / "cobranca_assessorias.csv"
PAGAMENTOS_PATH = DATA_DIR / "fluxo_pagamentos.xlsx"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    df_cobranca_raw = read_csv(COBRANCA_PATH)
    df_pagamentos_raw = pd.read_excel(PAGAMENTOS_PATH, engine="openpyxl")

    df_cobranca = clean_cobranca(df_cobranca_raw)
    df_pagamentos = clean_pagamentos(df_pagamentos_raw)
    df_merged = merge_cobranca_pagamentos(df_cobranca, df_pagamentos)

    exploratoria = build_exploratoria(df_cobranca, df_pagamentos, df_merged)
    analytics = build_analytics(df_cobranca, df_pagamentos, df_merged, exploratoria)

    write_json(OUTPUT_DIR / "kpis.json", analytics["kpis"])
    write_json(OUTPUT_DIR / "dashboards.json", analytics["dashboards"])
    write_json(OUTPUT_DIR / "insights.json", analytics["insights"])
    write_json(OUTPUT_DIR / "validacao_dados.json", analytics["validacaoDados"])

    print(f"Analise ORION concluida. Arquivos gerados em: {OUTPUT_DIR}")


def read_csv(path: Path) -> pd.DataFrame:
    try:
        return pd.read_csv(path, encoding="utf-8-sig")
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="latin1")


def clean_cobranca(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [column.strip() for column in df.columns]
    df = df.drop_duplicates()

    df["ID_Contrato"] = clean_text_series(df.get("ID_Contrato", pd.Series(dtype="object")))
    df = df[df["ID_Contrato"].notnull() & (df["ID_Contrato"] != "")]
    df = df.drop_duplicates(subset=["ID_Contrato"], keep="last")

    df["Nome_Assessoria"] = clean_text_series(df.get("Nome_Assessoria"), "Assessoria nao informada")
    df["Regiao_Cliente"] = clean_text_series(df.get("Regiao_Cliente"), "Nao informado").apply(normalize_region)
    df["Status_Cobranca"] = clean_text_series(df.get("Status_Cobranca"), "Em Aberto").apply(normalize_status)
    df["Data_Envio_Assessoria"] = parse_datetime_series(df.get("Data_Envio_Assessoria"))

    dias_atraso = pd.to_numeric(df.get("Dias_Em_Atraso_Inicial"), errors="coerce")
    df["Dias_Em_Atraso_Inicial"] = dias_atraso.fillna(0).clip(lower=0, upper=3650).round().astype(int)

    df["Valor_Inadimplente_Inicial"] = df.get("Valor_Inadimplente_Inicial", pd.Series(dtype="object")).apply(parse_money)
    score = pd.to_numeric(df.get("Score_Interno_Risco"), errors="coerce")
    df["Score_Interno_Risco"] = score.fillna(0).clip(lower=0, upper=100)
    df["Nivel_Risco"] = df.apply(classify_risk, axis=1)
    df["Faixa_Atraso"] = pd.cut(
        df["Dias_Em_Atraso_Inicial"],
        bins=[-1, 15, 60, math.inf],
        labels=["Ate 15 dias", "16 a 60 dias", "Acima de 60 dias"],
    )
    df["Indicador_Inadimplente"] = df["Valor_Inadimplente_Inicial"].gt(0)

    return df


def clean_pagamentos(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [column.strip() for column in df.columns]
    df = df.drop_duplicates()

    df["ID_Pagamento"] = clean_text_series(df.get("ID_Pagamento", pd.Series(dtype="object")))
    df["ID_Contrato"] = clean_text_series(df.get("ID_Contrato", pd.Series(dtype="object")))
    df = df[df["ID_Pagamento"].notnull() & df["ID_Contrato"].notnull()]
    df = df[(df["ID_Pagamento"] != "") & (df["ID_Contrato"] != "")]
    df = df.drop_duplicates(subset=["ID_Pagamento"], keep="last")

    df["Numero_Parcela"] = pd.to_numeric(df.get("Numero_Parcela"), errors="coerce").fillna(0).clip(lower=0).round().astype(int)
    df["Data_Vencimento"] = parse_datetime_series(df.get("Data_Vencimento"))
    df["Data_Pagamento"] = parse_datetime_series(df.get("Data_Pagamento"))
    df["Valor_Parcela"] = df.get("Valor_Parcela", pd.Series(dtype="object")).apply(parse_money)
    df["Valor_Pago"] = df.get("Valor_Pago", pd.Series(dtype="object")).apply(parse_money)
    df["Forma_Pagamento"] = clean_text_series(df.get("Forma_Pagamento"), "Nao informado").apply(normalize_payment_method)
    df["Indicador_Contemplado"] = clean_text_series(df.get("Indicador_Contemplado"), "Nao informado").apply(normalize_contemplado)
    df["Mes_Pagamento"] = df["Data_Pagamento"].dt.to_period("M").astype("string").fillna("Sem data")
    df["Atraso_Pagamento_Dias"] = (df["Data_Pagamento"] - df["Data_Vencimento"]).dt.days.fillna(0).clip(lower=0).astype(int)
    df["Situacao_Pagamento"] = df.apply(payment_situation, axis=1)
    df["Diferenca_Pago_Parcela"] = df["Valor_Pago"] - df["Valor_Parcela"]

    return df


def merge_cobranca_pagamentos(df_cobranca: pd.DataFrame, df_pagamentos: pd.DataFrame) -> pd.DataFrame:
    if df_pagamentos.empty:
        merged = df_cobranca.copy()
        merged["Forma_Pagamento"] = "Nao informado"
        merged["Indicador_Contemplado"] = "Nao informado"
        return merged

    latest = df_pagamentos.copy()
    latest["_Data_Comparavel"] = latest["Data_Pagamento"].fillna(latest["Data_Vencimento"]).fillna(pd.Timestamp("1900-01-01"))
    latest = latest.sort_values(["ID_Contrato", "_Data_Comparavel", "Numero_Parcela"]).drop_duplicates("ID_Contrato", keep="last")

    return df_cobranca.merge(
        latest[["ID_Contrato", "Forma_Pagamento", "Indicador_Contemplado"]],
        on="ID_Contrato",
        how="left",
    ).fillna({"Forma_Pagamento": "Nao informado", "Indicador_Contemplado": "Nao informado"})


def build_exploratoria(df_cobranca: pd.DataFrame, df_pagamentos: pd.DataFrame, df_merged: pd.DataFrame) -> dict[str, Any]:
    filtros_alto_risco = df_cobranca[df_cobranca["Nivel_Risco"].isin(["Alto"])]
    filtros_atraso_elevado = df_cobranca[df_cobranca["Dias_Em_Atraso_Inicial"] > 60]
    filtros_status_critico = df_cobranca[df_cobranca["Status_Cobranca"].isin(["Insucesso", "Ajuizado"])]

    return {
        "head": {
            "cobranca": to_records(df_cobranca.head(10)),
            "pagamentos": to_records(df_pagamentos.head(10)),
            "merge": to_records(df_merged.head(10)),
        },
        "info": {
            "cobranca": dataframe_info(df_cobranca),
            "pagamentos": dataframe_info(df_pagamentos),
        },
        "describe": {
            "cobranca": describe_frame(df_cobranca),
            "pagamentos": describe_frame(df_pagamentos),
        },
        "valueCounts": {
            "statusCobranca": value_counts(df_cobranca["Status_Cobranca"]),
            "regioes": value_counts(df_cobranca["Regiao_Cliente"]),
            "formasPagamento": value_counts(df_pagamentos["Forma_Pagamento"]) if not df_pagamentos.empty else [],
            "nivelRisco": value_counts(df_cobranca["Nivel_Risco"]),
        },
        "groupby": {
            "inadimplenciaPorRegiao": to_records(
                df_cobranca.groupby("Regiao_Cliente", dropna=False)
                .agg(
                    contratos=("ID_Contrato", "count"),
                    valorInadimplente=("Valor_Inadimplente_Inicial", "sum"),
                    atrasoMedio=("Dias_Em_Atraso_Inicial", "mean"),
                    scoreMedio=("Score_Interno_Risco", "mean"),
                )
                .reset_index()
                .sort_values("valorInadimplente", ascending=False)
            ),
            "pagamentosPorMes": to_records(
                df_pagamentos.groupby("Mes_Pagamento", dropna=False)
                .agg(pagamentos=("ID_Pagamento", "count"), recuperado=("Valor_Pago", "sum"))
                .reset_index()
                .sort_values("Mes_Pagamento")
            )
            if not df_pagamentos.empty
            else [],
        },
        "sortValues": {
            "maioresAtrasos": to_records(df_cobranca.sort_values("Dias_Em_Atraso_Inicial", ascending=False).head(10)),
            "maioresValores": to_records(df_cobranca.sort_values("Valor_Inadimplente_Inicial", ascending=False).head(10)),
        },
        "filtrosBooleanos": {
            "altoRisco": to_records(filtros_alto_risco.head(20)),
            "atrasoElevado": to_records(filtros_atraso_elevado.head(20)),
            "statusCriticoComIsin": to_records(filtros_status_critico.head(20)),
        },
        "colunasDerivadas": [
            "Nivel_Risco",
            "Faixa_Atraso",
            "Indicador_Inadimplente",
            "Mes_Pagamento",
            "Atraso_Pagamento_Dias",
            "Situacao_Pagamento",
            "Diferenca_Pago_Parcela",
        ],
    }


def build_analytics(
    df_cobranca: pd.DataFrame,
    df_pagamentos: pd.DataFrame,
    df_merged: pd.DataFrame,
    exploratoria: dict[str, Any],
) -> dict[str, Any]:
    contratos = build_contratos(df_merged)
    pagamentos = build_pagamentos(df_pagamentos)
    cobranca_status = count_records(df_cobranca["Status_Cobranca"], "status", "quantidade")
    status_counts = {item["status"]: item["quantidade"] for item in cobranca_status}
    regioes = build_regioes(df_cobranca)
    formas_pagamento = build_formas_pagamento(df_pagamentos)
    evolucao_pagamentos = build_evolucao_pagamentos(df_pagamentos)
    distribuicao_risco = build_distribuicao_risco(df_cobranca)
    assessorias = build_assessorias(df_cobranca)
    clientes_prioritarios = build_clientes_prioritarios(contratos)
    alertas = build_alertas(clientes_prioritarios)
    contratos_por_id = {item["idContrato"]: item for item in contratos}
    historicos_financeiros = build_historicos(df_pagamentos)
    patterns = build_patterns(regioes, cobranca_status, formas_pagamento, distribuicao_risco, clientes_prioritarios, evolucao_pagamentos)

    total_valor_inadimplente = float(df_cobranca["Valor_Inadimplente_Inicial"].sum())
    total_valor_pago = float(df_pagamentos["Valor_Pago"].sum()) if not df_pagamentos.empty else 0.0
    total_valor_parcela = float(df_pagamentos["Valor_Parcela"].sum()) if not df_pagamentos.empty else 0.0
    contratos_inadimplentes = int(df_cobranca["Indicador_Inadimplente"].sum())
    total_contratos = int(len(df_cobranca))
    taxa_recuperacao = (total_valor_pago / total_valor_parcela * 100) if total_valor_parcela > 0 else 0
    atraso_medio = float(df_cobranca["Dias_Em_Atraso_Inicial"].mean()) if total_contratos else 0
    score_medio = float(df_cobranca["Score_Interno_Risco"].mean()) if total_contratos else 0
    tendencia_temporal = build_tendencia_temporal(evolucao_pagamentos)

    kpis = {
        "inadimplencia": round_number((contratos_inadimplentes / total_contratos * 100) if total_contratos else 0),
        "recuperacao": round_number(taxa_recuperacao),
        "atrasoMedio": round_number(atraso_medio),
        "riscoRegional": regioes,
        "tendenciaTemporal": tendencia_temporal,
        "valorTotalInadimplente": round_number(total_valor_inadimplente),
        "contratosEmAberto": status_counts.get("Em Aberto", 0),
        "quantidadeContratosPorStatus": cobranca_status,
        "scoreMedioRisco": round_number(score_medio),
        "contratosPorNivelRisco": [{"nivel": item["nivel"], "quantidade": item["quantidade"]} for item in risk_count_records(df_cobranca)],
        "formaPagamentoMaisUtilizada": patterns["formaPagamentoPredominante"],
        "pagamentosPorMes": evolucao_pagamentos,
        "contratosPrioritarios": clientes_prioritarios,
        "contratosComMaiorAtraso": patterns["contratosComMaiorAtraso"],
        "valorInadimplentePorRegiao": [{"regiao": item["regiao"], "valorInadimplente": item["valorInadimplente"]} for item in regioes],
        "taxaRecuperacao": round_number(taxa_recuperacao),
        "contratosInadimplentes": total_contratos,
    }

    insights = build_insights(kpis, patterns)

    dashboards = {
        "contratos": contratos,
        "pagamentos": pagamentos,
        "cobrancaStatus": cobranca_status,
        "distribuicaoRisco": distribuicao_risco,
        "formasPagamento": formas_pagamento,
        "regioes": regioes,
        "evolucaoPagamentos": evolucao_pagamentos,
        "assessorias": assessorias,
        "clientesPrioritarios": clientes_prioritarios,
        "alertas": alertas,
        "contratosPorId": contratos_por_id,
        "historicosFinanceiros": historicos_financeiros,
        "patterns": patterns,
        "relatorioGerencial": {
            "indicadores": [
                {"titulo": "Valor total em risco", "valor": kpis["valorTotalInadimplente"]},
                {"titulo": "Valor recuperado", "valor": round_number(total_valor_pago)},
                {"titulo": "Efetividade de recuperacao", "valor": kpis["taxaRecuperacao"], "sufixo": "%"},
                {"titulo": "Contratos criticos", "valor": int((df_cobranca["Nivel_Risco"] == "Alto").sum())},
            ],
            "resumo": insights["diretoria"][0],
        },
        "resumoCarga": {
            "contratos": total_contratos,
            "pagamentos": int(len(df_pagamentos)),
            "arquivos": {"cobranca": str(COBRANCA_PATH), "pagamentos": str(PAGAMENTOS_PATH)},
            "origem": "Python + Pandas",
        },
    }

    validacao_dados = {
        "totalRegistrosCsv": int(len(df_cobranca)),
        "totalRegistrosXlsx": int(len(df_pagamentos)),
        "primeirosRegistrosCsv": to_records(df_cobranca.head(20)),
        "primeirosRegistrosXlsx": to_records(df_pagamentos.head(20)),
        "nulosCsv": {key: int(value) for key, value in df_cobranca.isnull().sum().to_dict().items()},
        "nulosXlsx": {key: int(value) for key, value in df_pagamentos.isnull().sum().to_dict().items()},
        "duplicadosCsvRemovidos": int(max(0, len(read_csv(COBRANCA_PATH)) - len(df_cobranca))),
        "duplicadosXlsxRemovidos": int(max(0, len(pd.read_excel(PAGAMENTOS_PATH, engine="openpyxl")) - len(df_pagamentos))),
        "registrosDiasAtrasoInconsistentesTratados": int(
            pd.to_numeric(read_csv(COBRANCA_PATH).get("Dias_Em_Atraso_Inicial"), errors="coerce").lt(0).fillna(False).sum()
        ),
        "exploratoria": exploratoria,
        "kpis": kpis,
        "geradoEm": datetime.now(timezone.utc).isoformat(),
    }

    return {"kpis": kpis, "dashboards": dashboards, "insights": insights, "validacaoDados": validacao_dados}


def build_contratos(df: pd.DataFrame) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        items.append(
            {
                "idContrato": row["ID_Contrato"],
                "cliente": f"Contrato {row['ID_Contrato']}",
                "assessoria": row["Nome_Assessoria"],
                "dataEnvioAssessoria": date_to_iso(row["Data_Envio_Assessoria"]),
                "diasAtraso": int(row["Dias_Em_Atraso_Inicial"]),
                "valorInadimplente": round_number(row["Valor_Inadimplente_Inicial"]),
                "statusCobranca": row["Status_Cobranca"],
                "scoreRisco": round_number(row["Score_Interno_Risco"]),
                "regiao": row["Regiao_Cliente"],
                "nivelRisco": row["Nivel_Risco"],
                "formaPagamento": row.get("Forma_Pagamento", "Nao informado"),
                "indicadorContemplacao": row.get("Indicador_Contemplado", "Nao informado"),
            }
        )

    return items


def build_pagamentos(df: pd.DataFrame) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        items.append(
            {
                "idPagamento": row["ID_Pagamento"],
                "idContrato": row["ID_Contrato"],
                "parcela": int(row["Numero_Parcela"]),
                "vencimento": date_to_iso(row["Data_Vencimento"]),
                "pagamento": date_to_iso(row["Data_Pagamento"]),
                "valorParcela": round_number(row["Valor_Parcela"]),
                "valorPago": round_number(row["Valor_Pago"]),
                "formaPagamento": row["Forma_Pagamento"],
                "indicadorContemplacao": row["Indicador_Contemplado"],
            }
        )

    return items


def build_regioes(df: pd.DataFrame) -> list[dict[str, Any]]:
    grouped = (
        df.groupby("Regiao_Cliente", dropna=False)
        .agg(
            contratos=("ID_Contrato", "count"),
            valorInadimplente=("Valor_Inadimplente_Inicial", "sum"),
            riscoAlto=("Nivel_Risco", lambda values: int((values == "Alto").sum())),
        )
        .reset_index()
    )
    grouped["percentualRiscoAlto"] = grouped.apply(
        lambda row: round_number(row["riscoAlto"] / row["contratos"] * 100 if row["contratos"] else 0, 1),
        axis=1,
    )
    grouped["exposicaoFinanceira"] = grouped["valorInadimplente"]
    grouped = grouped.sort_values("valorInadimplente", ascending=False)

    return [
        {
            "regiao": row["Regiao_Cliente"],
            "contratos": int(row["contratos"]),
            "valorInadimplente": round_number(row["valorInadimplente"]),
            "exposicaoFinanceira": round_number(row["exposicaoFinanceira"]),
            "riscoAlto": int(row["riscoAlto"]),
            "percentualRiscoAlto": round_number(row["percentualRiscoAlto"], 1),
        }
        for _, row in grouped.iterrows()
    ]


def build_formas_pagamento(df: pd.DataFrame) -> list[dict[str, Any]]:
    total = len(df)
    if total == 0:
        return []

    counts = df["Forma_Pagamento"].value_counts(dropna=False)
    return [{"forma": str(key), "percentual": round_number(value / total * 100, 1)} for key, value in counts.items()]


def build_evolucao_pagamentos(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []

    pagamentos_validos = df[df["Data_Pagamento"].notnull() & (df["Valor_Pago"] > 0)].copy()
    if pagamentos_validos.empty:
        return []

    pagamentos_validos["Mes"] = pagamentos_validos["Data_Pagamento"].dt.to_period("M").astype(str)
    grouped = (
        pagamentos_validos.groupby("Mes")
        .agg(pagamentos=("ID_Pagamento", "count"), recuperado=("Valor_Pago", "sum"))
        .reset_index()
        .sort_values("Mes")
        .tail(12)
    )

    return [
        {"mes": format_month(row["Mes"]), "pagamentos": int(row["pagamentos"]), "recuperado": round_number(row["recuperado"])}
        for _, row in grouped.iterrows()
    ]


def build_distribuicao_risco(df: pd.DataFrame) -> list[dict[str, Any]]:
    total = len(df) or 1
    colors = {"Alto": "#dc2626", "Medio": "#f97316", "Médio": "#f97316", "Baixo": "#16a34a"}
    counts = df["Nivel_Risco"].value_counts()

    return [
        {"nivel": nivel, "percentual": round_number(counts.get(nivel, 0) / total * 100, 1), "cor": colors[nivel]}
        for nivel in ["Alto", "Médio", "Baixo"]
    ]


def build_assessorias(df: pd.DataFrame) -> list[dict[str, Any]]:
    grouped = (
        df.groupby("Nome_Assessoria")
        .agg(contratos=("ID_Contrato", "count"), emAberto=("Status_Cobranca", lambda values: int((values == "Em Aberto").sum())))
        .reset_index()
        .sort_values("contratos", ascending=False)
        .head(5)
    )

    return [{"nome": row["Nome_Assessoria"], "contratos": int(row["contratos"]), "emAberto": int(row["emAberto"])} for _, row in grouped.iterrows()]


def build_clientes_prioritarios(contratos: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        [item for item in contratos if item["nivelRisco"] == "Alto" or item["valorInadimplente"] > 0],
        key=lambda item: (
            risk_weight(item["nivelRisco"]),
            item["diasAtraso"],
            item["valorInadimplente"],
            item["scoreRisco"],
        ),
        reverse=True,
    )[:20]


def build_alertas(clientes_prioritarios: list[dict[str, Any]]) -> list[dict[str, Any]]:
    today = datetime.now(timezone.utc).date().isoformat()
    alertas = []

    for item in clientes_prioritarios:
        if item["nivelRisco"] != "Alto":
            continue

        alertas.append(
            {
                "contrato": item["idContrato"],
                "cliente": item["cliente"],
                "motivo": alert_reason(item),
                "diasAtraso": item["diasAtraso"],
                "data": today,
                "nivelRisco": item["nivelRisco"],
                "status": "Critico" if item["statusCobranca"] == "Ajuizado" or item["diasAtraso"] > 120 or item["scoreRisco"] > 80 else "Atencao",
            }
        )

    return alertas[:20]


def build_historicos(df: pd.DataFrame) -> dict[str, list[dict[str, Any]]]:
    historicos: dict[str, list[dict[str, Any]]] = {}

    for id_contrato, group in df.sort_values(["ID_Contrato", "Numero_Parcela", "Data_Vencimento"]).groupby("ID_Contrato"):
        historicos[id_contrato] = [
            {
                "parcela": int(row["Numero_Parcela"]),
                "vencimento": date_to_iso(row["Data_Vencimento"]),
                "pagamento": date_to_iso(row["Data_Pagamento"]),
                "valorParcela": round_number(row["Valor_Parcela"]),
                "valorPago": round_number(row["Valor_Pago"]),
                "formaPagamento": row["Forma_Pagamento"],
                "indicadorContemplacao": row["Indicador_Contemplado"],
                "situacao": row["Situacao_Pagamento"],
            }
            for _, row in group.iterrows()
        ]

    return historicos


def build_patterns(
    regioes: list[dict[str, Any]],
    cobranca_status: list[dict[str, Any]],
    formas_pagamento: list[dict[str, Any]],
    distribuicao_risco: list[dict[str, Any]],
    clientes_prioritarios: list[dict[str, Any]],
    evolucao_pagamentos: list[dict[str, Any]],
) -> dict[str, Any]:
    regiao_maior_inadimplencia = regioes[0] if regioes else None
    status_mais_frequente = cobranca_status[0] if cobranca_status else None
    forma_predominante = formas_pagamento[0] if formas_pagamento else None
    concentracao_alto = next((item for item in distribuicao_risco if item["nivel"] == "Alto"), None)
    regiao_maior_risco = sorted(regioes, key=lambda item: item["percentualRiscoAlto"], reverse=True)[0] if regioes else None

    return {
        "regioesMaiorInadimplencia": [item["regiao"] for item in regioes[:3]],
        "regiaoMaiorInadimplencia": regiao_maior_inadimplencia["regiao"] if regiao_maior_inadimplencia else "Sem dados",
        "statusMaisFrequente": status_mais_frequente["status"] if status_mais_frequente else "Sem dados",
        "maiorConcentracaoRisco": regiao_maior_risco["regiao"] if regiao_maior_risco else "Sem dados",
        "formaPagamentoPredominante": forma_predominante["forma"] if forma_predominante else "Sem dados",
        "comportamentoTemporalPagamentos": describe_temporal_behavior(evolucao_pagamentos),
        "contratosComMaiorAtraso": [
            {
                "idContrato": item["idContrato"],
                "diasAtraso": item["diasAtraso"],
                "valorInadimplente": item["valorInadimplente"],
                "nivelRisco": item["nivelRisco"],
            }
            for item in clientes_prioritarios[:5]
        ],
        "concentracaoRiscoAlto": concentracao_alto["percentual"] if concentracao_alto else 0,
        "regiaoMaiorRisco": regiao_maior_risco["regiao"] if regiao_maior_risco else "Sem dados",
    }


def build_tendencia_temporal(evolucao_pagamentos: list[dict[str, Any]]) -> dict[str, Any]:
    previous = evolucao_pagamentos[-2] if len(evolucao_pagamentos) >= 2 else None
    current = evolucao_pagamentos[-1] if evolucao_pagamentos else None

    if not previous or not current or previous["recuperado"] == 0:
        return {
            "direcao": "estavel",
            "variacaoPercentual": 0,
            "mesAtual": current["mes"] if current else "Sem dados",
            "mesAnterior": previous["mes"] if previous else "Sem dados",
        }

    variation = (current["recuperado"] - previous["recuperado"]) / previous["recuperado"] * 100
    direction = "alta" if variation > 2 else "queda" if variation < -2 else "estavel"

    return {
        "direcao": direction,
        "variacaoPercentual": round_number(variation, 1),
        "mesAtual": current["mes"],
        "mesAnterior": previous["mes"],
    }


def build_insights(kpis: dict[str, Any], patterns: dict[str, Any]) -> dict[str, Any]:
    return {
        "diretoria": [
            f"A carteira analisada reune {format_integer(kpis['contratosInadimplentes'])} contratos e {format_currency(kpis['valorTotalInadimplente'])} em valor inadimplente, com atraso medio de {kpis['atrasoMedio']} dias.",
            f"A recuperacao esta em {kpis['taxaRecuperacao']}%, com tendencia temporal de {kpis['tendenciaTemporal']['direcao']} entre {kpis['tendenciaTemporal']['mesAnterior']} e {kpis['tendenciaTemporal']['mesAtual']}.",
            f"{patterns['regiaoMaiorInadimplencia']} lidera a exposicao financeira e deve ser acompanhada na rotina executiva.",
        ],
        "financeiro": [
            f"A forma de pagamento predominante e {patterns['formaPagamentoPredominante']}, relevante para projecoes de caixa e acordos.",
            f"Contratos em aberto somam {format_integer(kpis['contratosEmAberto'])} casos e indicam potencial de priorizacao financeira.",
            "Os contratos prioritarios combinam atraso, valor inadimplente e score de risco para orientar negociacao.",
        ],
        "operacaoCobranca": [
            f"{patterns['statusMaisFrequente']} e o status de cobranca predominante e deve orientar cadencia operacional.",
            f"A concentracao de risco alto esta em {patterns['concentracaoRiscoAlto']}% dos contratos.",
            f"{patterns['regiaoMaiorRisco']} apresenta maior concentracao regional de risco alto e merece fila especifica.",
        ],
        "padroes": patterns,
        "geradoEm": datetime.now(timezone.utc).isoformat(),
    }


def clean_text_series(series: pd.Series | None, fallback: str = "") -> pd.Series:
    if series is None:
        series = pd.Series(dtype="object")

    return series.astype("string").str.normalize("NFC").str.strip().str.replace(r"\s+", " ", regex=True).fillna(fallback)


def parse_datetime_series(series: pd.Series | None) -> pd.Series:
    if series is None:
        return pd.Series(dtype="datetime64[ns]")

    parsed = pd.to_datetime(series, errors="coerce", dayfirst=False)
    missing = parsed.isna() & series.notnull()

    if missing.any():
        parsed.loc[missing] = pd.to_datetime(series.loc[missing], errors="coerce", dayfirst=True)

    return parsed


def parse_money(value: Any) -> float:
    if pd.isna(value):
        return 0.0

    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)

    text = str(value).strip().replace("R$", "").replace("\xa0", "").replace(" ", "")
    if "," in text:
        text = text.replace(".", "").replace(",", ".")

    text = re.sub(r"[^0-9.-]", "", text)

    try:
        return float(text) if text else 0.0
    except ValueError:
        return 0.0


def normalize_status(value: Any) -> str:
    text = remove_diacritics(str(value)).lower()

    if "ajuiz" in text or "judic" in text:
        return "Ajuizado"

    if "insucesso" in text or "sem exito" in text:
        return "Insucesso"

    if "acordo" in text or "negoci" in text:
        return "Acordo Firmado"

    return "Em Aberto"


def normalize_region(value: Any) -> str:
    text = remove_diacritics(str(value)).lower().strip()
    key = re.sub(r"[\s_-]+", "", text)
    regions = {
        "norte": "Norte",
        "nordeste": "Nordeste",
        "sul": "Sul",
        "sudeste": "Sudeste",
        "centrooeste": "Centro-Oeste",
        "naoinformado": "Nao informado",
    }

    return regions.get(key, title_case(text or "Nao informado"))


def normalize_payment_method(value: Any) -> str:
    text = remove_diacritics(str(value)).lower()

    if "pix" in text:
        return "Pix"

    if "debito" in text:
        return "Debito Automatico"

    if "boleto" in text:
        return "Boleto"

    return str(value).strip() or "Nao informado"


def normalize_contemplado(value: Any) -> str:
    text = remove_diacritics(str(value)).lower().strip()

    if text in {"sim", "s"}:
        return "Contemplado"

    if text in {"nao", "n"}:
        return "Nao contemplado"

    return "Nao informado"


def classify_risk(row: pd.Series) -> str:
    dias = int(row["Dias_Em_Atraso_Inicial"])
    status = row["Status_Cobranca"]
    score = float(row["Score_Interno_Risco"])

    if dias > 60 or status == "Ajuizado" or score > 70:
        return "Alto"

    if 16 <= dias <= 60 or status == "Insucesso":
        return "Médio"

    return "Baixo"


def payment_situation(row: pd.Series) -> str:
    if pd.isna(row["Data_Pagamento"]):
        return "Em atraso"

    if pd.isna(row["Data_Vencimento"]):
        return "Pago"

    return "Pago com atraso" if row["Data_Pagamento"] > row["Data_Vencimento"] else "Pago"


def dataframe_info(df: pd.DataFrame) -> str:
    buffer = io.StringIO()
    df.info(buf=buffer)
    return buffer.getvalue()


def describe_frame(df: pd.DataFrame) -> dict[str, Any]:
    try:
        description = df.describe(include="all", datetime_is_numeric=True)
    except TypeError:
        description = df.describe(include="all")

    return normalize_json(description.fillna("").to_dict())


def value_counts(series: pd.Series) -> list[dict[str, Any]]:
    return [{"valor": str(key), "quantidade": int(value)} for key, value in series.value_counts(dropna=False).items()]


def count_records(series: pd.Series, key_name: str, value_name: str) -> list[dict[str, Any]]:
    return [{key_name: str(key), value_name: int(value)} for key, value in series.value_counts(dropna=False).items()]


def risk_count_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    counts = df["Nivel_Risco"].value_counts()
    return [{"nivel": nivel, "quantidade": int(counts.get(nivel, 0))} for nivel in ["Alto", "Médio", "Baixo"]]


def describe_temporal_behavior(evolucao: list[dict[str, Any]]) -> str:
    tendencia = build_tendencia_temporal(evolucao)
    return f"{tendencia['direcao']} de {tendencia['variacaoPercentual']}% entre {tendencia['mesAnterior']} e {tendencia['mesAtual']}"


def alert_reason(item: dict[str, Any]) -> str:
    if item["statusCobranca"] == "Ajuizado":
        return "Status ajuizado exige acompanhamento juridico e financeiro"

    if item["diasAtraso"] > 120:
        return "Atraso superior a 120 dias com exposicao financeira elevada"

    if item["scoreRisco"] > 70:
        return "Score interno de risco acima de 70"

    return "Contrato classificado como alto risco"


def risk_weight(level: str) -> int:
    return {"Alto": 3, "Médio": 2, "Baixo": 1}.get(level, 0)


def date_to_iso(value: Any) -> str | None:
    if pd.isna(value):
        return None

    timestamp = pd.Timestamp(value)
    return timestamp.strftime("%Y-%m-%d")


def format_month(period: str) -> str:
    months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    year, month = period.split("-")
    return f"{months[int(month) - 1]}/{year[-2:]}"


def round_number(value: Any, digits: int = 2) -> float:
    number = float(value) if value is not None and not pd.isna(value) else 0.0
    return round(number if math.isfinite(number) else 0.0, digits)


def remove_diacritics(value: str) -> str:
    return "".join(character for character in unicodedata.normalize("NFD", value) if unicodedata.category(character) != "Mn")


def title_case(value: str) -> str:
    return " ".join(part.capitalize() for part in re.split(r"\s+", value.strip()) if part)


def format_currency(value: float) -> str:
    formatted = f"{value:,.0f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {formatted}"


def format_integer(value: int) -> str:
    return f"{value:,}".replace(",", ".")


def to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return normalize_json(df.astype(object).where(pd.notnull(df), None).to_dict(orient="records"))


def normalize_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): normalize_json(item) for key, item in value.items()}

    if isinstance(value, list):
        return [normalize_json(item) for item in value]

    if isinstance(value, tuple):
        return [normalize_json(item) for item in value]

    if isinstance(value, pd.Timestamp):
        return date_to_iso(value)

    if isinstance(value, pd.Period):
        return str(value)

    if pd.isna(value):
        return None

    if hasattr(value, "item"):
        try:
            return value.item()
        except ValueError:
            return str(value)

    return value


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(normalize_json(data), ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
