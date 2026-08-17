from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.patches import FancyBboxPatch


BASE = Path(__file__).resolve().parents[1]
INPUT = BASE / "06_RESULTADOS_CLIMA" / "idf_futura_ensemble.csv"
OUTPUT = BASE / "06_RESULTADOS_CLIMA" / "chuva_projeto_tr25_tr50_adaptacao.png"

NAVY = "#182554"
TEAL = "#167d78"
ORANGE = "#b55b00"
BLUE = "#3977a8"
INK = "#263248"
MUTED = "#5c6576"
PAPER = "#faf9f5"
GRID = "#d8dbe2"


def label_scenario(value: str) -> str:
    return {
        "ssp126": "SSP1-2.6",
        "ssp245": "SSP2-4.5",
        "ssp370": "SSP3-7.0",
        "ssp585": "SSP5-8.5",
    }[value]


def label_horizon(value: str) -> str:
    return value.replace("_", "–")


def add_tile(ax, x, y, width, height, title, tr, detail, color):
    box = FancyBboxPatch(
        (x, y), width, height, boxstyle="round,pad=0.018,rounding_size=0.025",
        transform=ax.transAxes, linewidth=0, facecolor="white",
    )
    ax.add_patch(box)
    ax.add_patch(FancyBboxPatch(
        (x, y), 0.018, height, boxstyle="round,pad=0.01,rounding_size=0.012",
        transform=ax.transAxes, linewidth=0, facecolor=color,
    ))
    ax.text(x + 0.035, y + height - 0.09, title, transform=ax.transAxes,
            fontsize=10, fontweight="bold", color=NAVY, va="top")
    ax.text(x + 0.035, y + 0.23, tr, transform=ax.transAxes,
            fontsize=23, fontweight="bold", color=color, va="center")
    ax.text(x + 0.035, y + 0.04, detail, transform=ax.transAxes,
            fontsize=8.5, color=MUTED, va="bottom", linespacing=1.25)


def main() -> None:
    df = pd.read_csv(INPUT)
    df["caso"] = df["cenario"].map(label_scenario) + "\n" + df["horizonte"].map(label_horizon)
    order = [(c, h) for c in ["ssp126", "ssp245", "ssp370", "ssp585"] for h in ["2040_2059", "2060_2100"]]
    cases = [f"{label_scenario(c)}\n{label_horizon(h)}" for c, h in order]
    xpos = np.arange(len(cases))
    colors = {25: TEAL, 50: ORANGE}

    fig = plt.figure(figsize=(14, 10), facecolor=PAPER)
    gs = fig.add_gridspec(2, 2, left=0.06, right=0.96, top=0.84, bottom=0.09, hspace=0.42, wspace=0.25)
    fig.text(0.06, 0.94, "Chuva de projeto e adaptação climática", fontsize=20, fontweight="bold", color=NAVY)
    fig.text(0.06, 0.905, "Bacias A+B | linha de base tradicional + envelope NEX-GDDP-CMIP6", fontsize=11, color=MUTED)
    fig.text(0.96, 0.94, "DPM · SEDEC", fontsize=10, fontweight="bold", color=TEAL, ha="right")

    # Panel 1: decision rule for the preliminary design.
    ax0 = fig.add_subplot(gs[0, 0])
    ax0.set_facecolor(PAPER)
    ax0.axis("off")
    ax0.text(0, 1.04, "Regra hidrológica de concepção", transform=ax0.transAxes,
             fontsize=13, fontweight="bold", color=NAVY, va="bottom")
    add_tile(ax0, 0.02, 0.48, 0.46, 0.40, "Coletores e bueiros", "TR25", "microdrenagem urbana\ncaptação e travessias", TEAL)
    add_tile(ax0, 0.52, 0.48, 0.46, 0.40, "Troncos e dissipadores", "TR50", "macrodrenagem\nsegurança e erosão", ORANGE)
    ax0.text(0.02, 0.30, "Cada regra é testada na linha de base e no envelope climático.", transform=ax0.transAxes,
             fontsize=9.5, color=INK)
    ax0.text(0.02, 0.17, "A escolha final considera continuidade, capacidade, velocidade,\njusante, manutenção e possibilidade de reforço futuro.", transform=ax0.transAxes,
             fontsize=9, color=MUTED, linespacing=1.35)

    # Panel 2: rainfall factors.
    ax1 = fig.add_subplot(gs[0, 1])
    ax1.set_title("Fator de chuva futura em relação à linha de base", loc="left", fontsize=13, fontweight="bold", color=NAVY, pad=12)
    for tr, color, offset in [(25, TEAL, -0.19), (50, ORANGE, 0.19)]:
        sub = df[df["tr_anos"].eq(tr)].set_index("caso").reindex(cases)
        med = sub["fator_mediana"].to_numpy(dtype=float)
        low = med - sub["fator_p10"].to_numpy(dtype=float)
        high = sub["fator_p90"].to_numpy(dtype=float) - med
        ax1.errorbar(xpos + offset, med, yerr=[low, high], fmt="o", color=color,
                     ecolor=color, elinewidth=2, capsize=4, markersize=5, label=f"TR{tr}")
    ax1.axhline(1.0, color=INK, linewidth=1, linestyle="--", alpha=0.8)
    ax1.set_xticks(xpos, cases, fontsize=7.5)
    ax1.set_ylabel("Fator multiplicativo", color=INK)
    ax1.set_ylim(0.55, 1.90)
    ax1.grid(axis="y", color=GRID, linewidth=0.7)
    ax1.legend(frameon=False, ncol=2, loc="upper left")
    ax1.text(0.99, 0.03, "pontos = mediana | barras = P10–P90", transform=ax1.transAxes,
             fontsize=8, color=MUTED, ha="right")

    # Panel 3: hydraulic size envelope.
    ax2 = fig.add_subplot(gs[1, 0])
    ax2.set_title("Efeito preliminar no diâmetro hidráulico", loc="left", fontsize=13, fontweight="bold", color=NAVY, pad=12)
    ax2.text(0, 1.01, "D/D₀ ≈ fator de chuva⁰·³⁷⁵ · mesma declividade, rugosidade e seção cheia", transform=ax2.transAxes,
             fontsize=8.5, color=MUTED, va="bottom")
    for tr, color, offset in [(25, TEAL, -0.19), (50, ORANGE, 0.19)]:
        sub = df[df["tr_anos"].eq(tr)].set_index("caso").reindex(cases)
        d10 = np.power(sub["fator_p10"].to_numpy(dtype=float), 0.375)
        dmed = np.power(sub["fator_mediana"].to_numpy(dtype=float), 0.375)
        d90 = np.power(sub["fator_p90"].to_numpy(dtype=float), 0.375)
        ax2.errorbar(xpos + offset, dmed, yerr=[dmed - d10, d90 - dmed], fmt="o", color=color,
                     ecolor=color, elinewidth=2, capsize=4, markersize=5, label=f"TR{tr}")
    ax2.axhline(1.0, color=INK, linewidth=1, linestyle="--", alpha=0.8)
    ax2.set_xticks(xpos, cases, fontsize=7.5)
    ax2.set_ylabel("Multiplicador de diâmetro")
    ax2.set_ylim(0.80, 1.27)
    ax2.grid(axis="y", color=GRID, linewidth=0.7)
    ax2.legend(frameon=False, ncol=2, loc="upper left")
    ax2.text(0.99, 0.03, "triagem de Manning; não é dimensionamento estrutural", transform=ax2.transAxes,
             fontsize=8, color=MUTED, ha="right")

    # Panel 4: 24-hour rainfall envelope.
    ax3 = fig.add_subplot(gs[1, 1])
    ax3.set_title("Lâmina diária de referência: faixa P10–P90", loc="left", fontsize=13, fontweight="bold", color=NAVY, pad=12)
    width = 0.32
    for tr, color, offset in [(25, TEAL, -width / 2), (50, ORANGE, width / 2)]:
        sub = df[df["tr_anos"].eq(tr)].set_index("caso").reindex(cases)
        med = sub["p24_mediana"].to_numpy(dtype=float)
        low = med - sub["p24_p10"].to_numpy(dtype=float)
        high = sub["p24_p90"].to_numpy(dtype=float) - med
        ax3.errorbar(xpos + offset, med, yerr=[low, high], fmt="o", color=color,
                     ecolor=color, elinewidth=2, capsize=4, markersize=5, label=f"TR{tr}")
    ax3.set_xticks(xpos, cases, fontsize=7.5)
    ax3.set_ylabel("P24 (mm)")
    ax3.grid(axis="y", color=GRID, linewidth=0.7)
    ax3.legend(frameon=False, ncol=2, loc="upper left")
    ax3.text(0.99, 0.03, "a faixa futura é cenário de sensibilidade", transform=ax3.transAxes,
             fontsize=8, color=MUTED, ha="right")

    fig.text(0.06, 0.028,
             "P10–P90 = dispersão entre modelos. Fatores mínimos e máximos absolutos permanecem nos arquivos auditáveis. "
             "A rodada climática ainda não substitui os hietogramas tradicionais do SWMM.",
             fontsize=8.5, color=MUTED)
    fig.savefig(OUTPUT, dpi=240, bbox_inches="tight", facecolor=PAPER)
    print(OUTPUT)


if __name__ == "__main__":
    main()
