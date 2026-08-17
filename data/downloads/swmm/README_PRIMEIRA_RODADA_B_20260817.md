# Rodada reproduzida e pré-dimensionamento preliminar — Bacia B — 17/08/2026

## Escopo

Esta rodada reproduz o lançamento recebido para a Bacia B: três arquivos de tronco, dois arquivos de coletor e dois trechos de dissipação. A rede foi recortada no limite revisado da Bacia B, nodalizada com snap de até 2 m e orientada pelo declive amostrado no MDT híbrido em EPSG:31985. O modelo foi regenerado e executado novamente no EPA SWMM 5.2.4 em 17/08/2026.

## Premissas

- EPA SWMM 5.2.4;
- SIRGAS 2000 / UTM 25S — EPSG:31985;
- chuva tradicional copiada do modelo de referência, cenários TR25 e TR50;
- infiltração CN-SCS;
- CN médio preliminar da Bacia B: 76,77, derivado do recorte CN 2022 SNIRH/ANA;
- 30% de impermeabilização como premissa inicial;
- diâmetros placeholder: 0,60 m para coletores, 0,80 m para troncos e 1,20 m para trechos de dissipação;
- rugosidade de Manning: 0,013;
- áreas de contribuição: Voronoi preliminar dos nós, recortado no limite da Bacia B.

## Normalização topológica

O SWMM não aceita múltiplos links diretamente em um outfall. O nó `N_B_0030` recebeu três entradas; por isso, a cópia integrada recebeu o nó/conector topológico `N_B_C0030`/`L_B_C0030`. Esse conector é um recurso numérico de montagem e não representa uma obra física.

## Dissipadores

Os trechos `Trechos_Dissipacao_B.shp` foram orientados pela cota do MDT. O ponto de maior cota foi tratado como entrada e o de menor cota como saída. Cada linha foi representada por um conduto placeholder `D_B_*` até um outfall `O_B_DISS_*`. Essa representação permite registrar a vazão de chegada, mas não substitui o dimensionamento de escada, degraus, bacia de dissipação, revestimento, fundação, proteção de talude ou geotecnia.

## Pré-dimensionamento por Manning

A tabela `swmm_predimensionamento_trechos_B.csv` contém a triagem por conduto físico para TR25 e TR50, usando a vazão máxima simulada, seção circular placeholder e rugosidade de Manning 0,013. A contagem de candidatos nominais é:

| Diâmetro candidato | TR25 | TR50 |
|---:|---:|---:|
| 0,30 m | 5 | 4 |
| 0,40 m | 11 | 11 |
| 0,50 m | 7 | 8 |
| 0,60 m | 3 | 1 |
| 0,80 m | 6 | 7 |
| 1,00 m | 11 | 12 |
| 1,20 m | 1 | 1 |
| 1,50 m | 1 | 1 |
| Auditar | 1 | 1 |

Os valores são candidatos de concepção, não quantitativos executivos. `D_B_01` permanece como `AUDITAR` porque o placeholder ficou com cotas de entrada e saída coincidentes. `D_B_02` resulta em 1,20 m, mas com velocidade preliminar próxima de 9,4 m/s no TR50, exigindo projeto específico de dissipação e proteção contra erosão.

## Resultados sintéticos

| Cenário | Erro runoff | Erro routing | Nós inundados | Links físicos acima da capacidade cheia | Perda por inundação | Vazão externa |
|---|---:|---:|---:|---:|---:|---:|
| TR25 | -0,013% | -0,019% | 18 | 12 | 32,713 milhões L | 66,645 milhões L |
| TR50 | -0,013% | -0,012% | 18 | 12 | 41,270 milhões L | 71,175 milhões L |

Vazões máximas nos dissipadores: `DISS_B_01` = 5,039 m³/s no TR25 e 5,199 m³/s no TR50; `DISS_B_02` = 7,133 m³/s no TR25 e 7,705 m³/s no TR50.

## Leitura e limitações

O balanço numérico é aceitável para uma rodada exploratória reproduzida. A inundação e as sobrecargas não são quantitativos de obra: podem ser alteradas pela revisão das áreas de quadra, CN por subárea, impermeabilização, cotas de fundo, diâmetros, condições de jusante e conectividade dos dois componentes.

O trecho `D_B_01` apresentou alerta de desnível mínimo automático e razão de capacidade muito elevada. Esse resultado deve ser tratado como alerta de revisão do dissipador, não como indicação de diâmetro. A versão seguinte deve substituir o placeholder por uma representação hidráulica compatível com a solução estrutural escolhida.

## Condição de fechamento da Bacia B

Além de `O_B_DISS_01` e `O_B_DISS_02`, o modelo ainda apresenta `N_B_0030` como terceiro outfall, com vazão máxima de 3,403 m³/s no TR25 e 3,933 m³/s no TR50. Assim, toda a água da rede ainda não está direcionada apenas aos dois dissipadores marcados. Essa condição deve ser resolvida no GIS antes de definir metas: `N_B_0030` pode ser uma saída real, uma conexão não desenhada, um componente a conectar a um dissipador ou um erro de lançamento. O conector `L_B_C0030` é apenas topológico e não representa uma obra física.

## Próximas ações

1. Conferir no ArcMap/QGIS a conexão espacial dos 46 links físicos, do conector topológico e dos dois dissipadores.
2. Delimitar as áreas reais de quadras, ruas, sarjetas e pontos de captação.
3. Amostrar cotas de fundo e revisar diâmetros e materiais.
4. Confirmar cada exutório, condição de jusante e necessidade de proteção erosiva.
5. Reexecutar TR25/TR50 e, depois, os cenários de mudança climática.
6. Selecionar, somente após essa revisão, os trechos da Bacia B que serão convertidos em metas do Plano de Trabalho.
