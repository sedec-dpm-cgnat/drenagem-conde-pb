from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


BASE = Path(__file__).resolve().parents[1]
INPUT = BASE / "06_RESULTADOS_CLIMA" / "idf_futura_ensemble.csv"
OUTPUT = BASE / "06_RESULTADOS_CLIMA" / "idf_cenarios_incerteza.png"


def intensidade_base(tr: int, duracao_min: pd.Series) -> pd.Series:
    """IDF SGB/CPRM 2023 usada como linha de base local."""
    return 1424.1 * (tr ** 0.1305) / ((duracao_min + 23.6) ** 0.7468)


def main() -> None:
    df = pd.read_csv(INPUT)
    duracoes = pd.Series([15, 30, 60, 120, 360, 720, 1440], dtype=float)
    cenarios = ["ssp126", "ssp245", "ssp370", "ssp585"]
    rotulos = {
        "ssp126": "SSP1-2.6",
        "ssp245": "SSP2-4.5",
        "ssp370": "SSP3-7.0",
        "ssp585": "SSP5-8.5",
    }
    cores = {25: "#187d78", 50: "#994b00"}
    fig, axes = plt.subplots(4, 2, figsize=(12, 15), sharex=True, sharey=True)
    fig.suptitle(
        "IDF de sensibilidade climática - Bacias A+B\n"
        "Linha de base local e faixa P10-mediana-P90 do NEX-GDDP-CMIP6",
        fontsize=15,
        fontweight="bold",
        color="#16224e",
    )
    for row, cenario in enumerate(cenarios):
        for col, horizonte in enumerate(["2040_2059", "2060_2100"]):
            ax = axes[row, col]
            subset = df[(df["cenario"] == cenario) & (df["horizonte"] == horizonte)]
            for tr in [25, 50]:
                base = intensidade_base(tr, duracoes)
                item = subset[subset["tr_anos"] == tr].iloc[0]
                p10 = base * item["fator_p10"]
                mediana = base * item["fator_mediana"]
                p90 = base * item["fator_p90"]
                color = cores[tr]
                ax.fill_between(duracoes, p10, p90, color=color, alpha=0.12)
                ax.plot(duracoes, mediana, color=color, linewidth=2, label=f"TR{tr} mediana")
                if row == 0 and col == 0:
                    ax.plot(duracoes, base, color=color, linestyle="--", linewidth=0.9, alpha=0.8, label=f"TR{tr} base")
            ax.set_xscale("log")
            ax.set_yscale("log")
            ax.grid(True, which="both", color="#d7d7d7", linewidth=0.5, alpha=0.65)
            ax.set_title(f"{rotulos[cenario]} | {horizonte.replace('_', '-')} ", fontsize=10, color="#16224e")
            ax.set_xlabel("Duração (min)")
            ax.set_ylabel("Intensidade (mm/h)")
            ax.set_xticks(duracoes)
            ax.set_xticklabels([str(int(v)) for v in duracoes], rotation=45, fontsize=8)
            ax.tick_params(axis="y", labelsize=8)
    axes[0, 0].legend(fontsize=8, loc="upper right")
    fig.text(
        0.5,
        0.015,
        "Sombreamento = P10-P90 entre modelos; linhas tracejadas = IDF local de referência. "
        "A escala futura foi aplicada como teste de sensibilidade às durações da IDF local; não é uma IDF subdiária futura calibrada.",
        ha="center",
        va="bottom",
        fontsize=9,
        color="#3f4b63",
    )
    fig.tight_layout(rect=[0, 0.045, 1, 0.965])
    fig.savefig(OUTPUT, dpi=220, bbox_inches="tight", facecolor="white")
    print(OUTPUT)


if __name__ == "__main__":
    main()
