# Primeira rodada integrada do SWMM — Bacia A

Data da execução: 16/08/2026  
Versão: EPA SWMM 5.2.4  
Cenários: TR25 e TR50  
Modelo: `CONDE_BACIA_A_REDE_DISSIPADORES_TR25/50.inp`

## Resultado da execução

As duas simulações foram concluídas sem erro fatal. O balanço de continuidade ficou baixo:

| Cenário | Erro de continuidade do escoamento | Erro de continuidade do roteamento | Perda por inundação |
|---|---:|---:|---:|
| TR25 | -0,018% | -0,004% | 0,664 milhões de litros |
| TR50 | -0,018% | -0,005% | 1,396 milhões de litros |

O modelo ainda apresentou advertências de declividade mínima nos links `L_A_0008`, `L_A_0040`, `L_A_0064` e `L_A_0080`. Esses trechos precisam ser conferidos no GIS, porque a correção automática evita uma falha numérica, mas não corrige a cota real do projeto.

## Sinais de insuficiência na configuração atual

| Cenário | Nós com inundação | Links com vazão acima da capacidade cheia atual | Maior taxa de inundação |
|---|---:|---:|---:|
| TR25 | 28 | 34 | 1,679 m³/s em `N_A_0019` |
| TR50 | 35 | 37 | 2,205 m³/s em `N_A_0019` |

Os indicadores não são ainda dimensionamento executivo. Eles mostram onde a configuração atual, com seções predominantemente circulares de 0,60 m e 0,80 m, não suporta a vazão simulada ou onde a geometria/cota precisa ser auditada.

## Vazões preliminares nos dissipadores

| Dissipador | Saída SWMM | TR25 (m³/s) | TR50 (m³/s) | Observação |
|---|---|---:|---:|---|
| DISS_01 | `N_A_0200` | 5,34 | 5,43 | saída existente; dissipação ainda não dimensionada |
| DISS_02 | `N_A_0190` | 0,87 | 1,00 | saída existente; dissipação ainda não dimensionada |
| DISS_03 | `N_A_0022` | 7,31 | 7,67 | maior vazão entre os dissipadores cadastrados |
| DISS_04 | `N_A_0195` | 4,94 | 5,19 | revisar o snap; afastamento cadastrado da rede |
| DISS_05 | `N_A_0193` | 5,06 | 5,58 | saída existente; dissipação ainda não dimensionada |

Os conectores `L_A_C*` usados no INP são apenas dispositivos topológicos provisórios para permitir uma entrada única em cada outfall. Eles não representam comprimento, diâmetro ou solução construtiva de dissipador.

## Próximas correções

1. Conferir no ArcMap/QGIS os links críticos e os quatro trechos com declividade mínima automática.
2. Revisar as cotas de fundo, o sentido e o nó de jusante de cada trecho.
3. Substituir as áreas template por áreas de contribuição de quadras e ruas validadas.
4. Atribuir CN 2022 por subárea, usando o recorte SNIRH/ANA como base espacial e não apenas o CN médio da bacia.
5. Recalcular as seções dos trechos críticos e revisar as saídas/dissipadores com cotas, vazões e condições de jusante.
6. Repetir TR25/TR50 e, depois, aplicar os cenários climáticos.

Esta rodada é uma triagem técnica para orientar a revisão do modelo. Não deve ser utilizada isoladamente para contratação ou execução.
