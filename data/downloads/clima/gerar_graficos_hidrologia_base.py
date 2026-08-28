from __future__ import annotations

import csv
import re
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


BASE = Path(__file__).resolve().parent
OUT = BASE
INPUT_HIET = BASE / "chuvas_TR25_TR50_base_relatorio.txt"

NAVY = "#16224e"
TEAL = "#187d78"
ORANGE = "#994b00"
BLUE = "#2f6f9f"
GRAY = "#5f6b7a"


def intensidade(tr: float, duracao_min: np.ndarray | float) -> np.ndarray | float:
    """Equacao IDF local SGB/CPRM 2023 usada na linha de base."""
    return 1424.1 * tr**0.1305 / (np.asarray(duracao_min) + 23.6) ** 0.7468


def ler_hietogramas() -> dict[str, list[tuple[int, float]]]:
    series: dict[str, list[tuple[int, float]]] = {}
    padrao = re.compile(r"^(TS_TR\d+)\s+(\d+):(\d+)\s+([\d.]+)")
    for linha in INPUT_HIET.read_text(encoding="utf-8").splitlines():
        match = padrao.match(linha)
        if not match:
            continue
        nome = match.group(1)
        minuto = int(match.group(2)) * 60 + int(match.group(3))
        intensidade_mm_h = float(match.group(4))
        series.setdefault(nome, []).append((minuto, intensidade_mm_h))
    return series


def escrever_csvs(series: dict[str, list[tuple[int, float]]]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    duracoes = [5, 10, 15, 30, 60, 120, 360, 720, 1440]
    with (OUT / "idf_base_conde.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["tr_anos", "duracao_min", "intensidade_mm_h", "precipitacao_mm", "equacao"])
        for tr in [2, 5, 10, 25, 50, 100]:
            for duracao in duracoes:
                i = float(intensidade(tr, duracao))
                writer.writerow([tr, duracao, f"{i:.6f}", f"{i * duracao / 60:.6f}", "i=1424.1*Tr^0.1305/(t+23.6)^0.7468"])

    with (OUT / "hietogramas_base_tr25_tr50.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["serie", "tempo_min", "intensidade_mm_h", "incremento_mm", "precipitacao_acumulada_mm"])
        for nome, pontos in series.items():
            acumulada = 0.0
            for minuto, i in pontos:
                incremento = i * 5 / 60
                acumulada += incremento
                writer.writerow([nome, minuto, f"{i:.6f}", f"{incremento:.6f}", f"{acumulada:.6f}"])


def grafico_idf() -> None:
    duracoes = np.logspace(np.log10(5), np.log10(1440), 180)
    fig, ax = plt.subplots(figsize=(10.5, 6.5))
    cores = {2: "#9aa5b1", 5: "#8da0cb", 10: "#66c2a5", 25: TEAL, 50: ORANGE, 100: "#8c2d5f"}
    for tr in [2, 5, 10, 25, 50, 100]:
        destaque = tr in (25, 50)
        ax.plot(duracoes, intensidade(tr, duracoes), color=cores[tr], linewidth=2.8 if destaque else 1.5,
                linestyle="-" if destaque else "--", label=f"TR{tr}")
    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_xlabel("Duração da chuva (min)")
    ax.set_ylabel("Intensidade (mm/h)")
    # Reserve a clear band above the plotting area: the equation is a subtitle
    # and must not collide with the figure title in the rendered PNG/PDF.
    ax.set_title("Curvas IDF da linha de base adotada — Conde/PB", loc="left", color=NAVY, weight="bold", pad=24)
    ax.text(0.0, 1.008, "i(Tr, t) = 1424,1 · Tr^0,1305 / (t + 23,6)^0,7468", transform=ax.transAxes,
            color=GRAY, fontsize=10, va="bottom")
    ax.grid(True, which="both", color="#d9dee5", linewidth=0.6, alpha=0.85)
    ax.legend(ncol=3, frameon=False, loc="upper right")
    ax.set_xlim(5, 1440)
    fig.text(0.5, 0.015, "Fonte da linha de base: relação IDF SGB/CPRM 2023 preservada no modelo anterior; t em minutos e i em mm/h.",
             ha="center", color=GRAY, fontsize=9)
    fig.tight_layout(rect=[0, 0.045, 1, 0.91])
    fig.savefig(OUT / "idf_base_curvas.png", dpi=240, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def grafico_frequencia() -> None:
    periodos = np.logspace(np.log10(2), np.log10(100), 160)
    duracoes = [15, 30, 60, 120]
    cores = ["#4c78a8", "#59a14f", TEAL, ORANGE]
    fig, ax = plt.subplots(figsize=(10.5, 6.0))
    for duracao, cor in zip(duracoes, cores):
        profundidade = intensidade(periodos, duracao) * duracao / 60
        ax.plot(periodos, profundidade, color=cor, linewidth=2.2, label=f"{duracao} min")
    ax.axvline(25, color=TEAL, linestyle=":", linewidth=1.5)
    ax.axvline(50, color=ORANGE, linestyle=":", linewidth=1.5)
    ax.text(25, ax.get_ylim()[1] * 0.94, "TR25", color=TEAL, ha="center", va="top", fontsize=9)
    ax.text(50, ax.get_ylim()[1] * 0.84, "TR50", color=ORANGE, ha="center", va="top", fontsize=9)
    ax.set_xscale("log")
    ax.set_xlabel("Período de retorno, Tr (anos)")
    ax.set_ylabel("Precipitação acumulada (mm)")
    ax.set_title("Análise de frequência representada pela IDF adotada", loc="left", color=NAVY, weight="bold", pad=12)
    ax.text(0.0, 1.02, "T = 1/p_e: o período de retorno é associado à probabilidade anual de excedência p_e.",
            transform=ax.transAxes, color=GRAY, fontsize=10)
    ax.grid(True, which="both", color="#d9dee5", linewidth=0.6, alpha=0.85)
    ax.legend(title="Duração", frameon=False, ncol=4, loc="upper left")
    fig.text(0.5, 0.015, "A curva representa a relação empírica adotada; a reestimativa estatística independente exige a série de máximas anuais da estação.",
             ha="center", color=GRAY, fontsize=9)
    fig.tight_layout(rect=[0, 0.045, 1, 0.95])
    fig.savefig(OUT / "curvas_frequencia_base.png", dpi=240, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def grafico_hietogramas(series: dict[str, list[tuple[int, float]]]) -> None:
    fig, axes = plt.subplots(2, 2, figsize=(11, 8.5), sharex="col")
    colors = {"TS_TR25": TEAL, "TS_TR50": ORANGE}
    for row, nome in enumerate(["TS_TR25", "TS_TR50"]):
        pontos = series[nome]
        tempos = np.array([p[0] for p in pontos], dtype=float)
        intensidades = np.array([p[1] for p in pontos], dtype=float)
        acumulada = np.cumsum(intensidades * 5 / 60)
        cor = colors[nome]
        axes[row, 0].bar(tempos, intensidades, width=4.4, color=cor, alpha=0.88, edgecolor="white", linewidth=0.35)
        axes[row, 0].axvline(60, color=NAVY, linestyle="--", linewidth=1.0, alpha=0.75)
        axes[row, 0].set_ylabel(f"{nome.replace('TS_', '')}\nIntensidade (mm/h)")
        axes[row, 1].plot(tempos, acumulada, color=cor, linewidth=2.4, marker="o", markersize=3)
        axes[row, 1].fill_between(tempos, acumulada, color=cor, alpha=0.10)
        axes[row, 1].set_ylabel("Acumulada (mm)")
        axes[row, 1].text(0.98, 0.91, f"P total = {acumulada[-1]:.2f} mm", transform=axes[row, 1].transAxes,
                           ha="right", color=cor, weight="bold")
        for ax in axes[row]:
            ax.grid(axis="y", color="#d9dee5", linewidth=0.6)
            ax.set_xlim(-5, 120)
    axes[0, 0].set_title("Hietograma de projeto", loc="left", color=NAVY, weight="bold")
    axes[0, 1].set_title("Precipitação acumulada", loc="left", color=NAVY, weight="bold")
    axes[1, 0].set_xlabel("Tempo desde o início (min)")
    axes[1, 1].set_xlabel("Tempo desde o início (min)")
    fig.suptitle("Chuvas de projeto tradicionais utilizadas na primeira rodada do SWMM", color=NAVY, weight="bold", fontsize=14)
    fig.text(0.5, 0.015, "Intervalo de cálculo: 5 min; duração representada: 120 min; pico posicionado em 60 min. Valores extraídos das séries temporais do modelo.",
             ha="center", color=GRAY, fontsize=9)
    fig.tight_layout(rect=[0, 0.045, 1, 0.95])
    fig.savefig(OUT / "hietogramas_base_tr25_tr50.png", dpi=240, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def main() -> None:
    series = ler_hietogramas()
    if set(series) != {"TS_TR25", "TS_TR50"}:
        raise RuntimeError(f"Series inesperadas no arquivo-base: {sorted(series)}")
    escrever_csvs(series)
    grafico_idf()
    grafico_frequencia()
    grafico_hietogramas(series)
    for path in [OUT / "idf_base_curvas.png", OUT / "curvas_frequencia_base.png", OUT / "hietogramas_base_tr25_tr50.png",
                 OUT / "idf_base_conde.csv", OUT / "hietogramas_base_tr25_tr50.csv"]:
        print(path)


if __name__ == "__main__":
    main()
