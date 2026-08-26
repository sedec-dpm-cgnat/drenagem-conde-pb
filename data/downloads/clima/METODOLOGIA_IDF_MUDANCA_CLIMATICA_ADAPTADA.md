# Metodologia de IDF sob mudança do clima — Conde/PB

## Fonte metodológica adotada

Nesta versão, a análise climática passa a seguir a cadeia metodológica publicada
no **Portal IDF-MC da SEDEC/MIDR**: [idf-mc.dpm-sedec-sas.tech](https://idf-mc.dpm-sedec-sas.tech/).
O portal é a fonte primária dos fatores e das curvas servidas; o relatório não
recalcula esses fatores a partir de uma amostra independente do banco NEX-GDDP.

Release consultado para Conde: `2026.08.002`, gerado em 13/08/2026. A ficha
municipal oficial é [Conde/PB — código 2504603](https://idf-mc.dpm-sedec-sas.tech/api/v1/municipios/2504603)
e o ponto publicado é `2504603-3300580`.

O artigo de Maity e Maity (2022) e o painel do NRCC/Cornell continuam como
referências de apresentação e comparação conceitual. Eles não são tratados como
fonte dos números do IDF-MC para este estudo.

## Cadeia de cálculo do IDF-MC

1. As máximas anuais de precipitação diária observada são organizadas para o
   município na janela **1981–2024**. Para Conde, são 44 anos, com fonte
   `xavier_brdwgd`, uma célula representativa e critério `knn_mancha`.
2. A distribuição de extremos adotada é **Gumbel**, ajustada pelo método dos
   momentos. Para um período de retorno `T`, o quantil é obtido por:

   `Q(T) = beta + alpha * [-ln(-ln(1 - 1/T))]`

   na parametrização retornada pela API, `alpha` é o parâmetro de escala e
   `beta` o parâmetro de posição. Para Conde, a ficha oficial informa
   `alpha = 23,5415`, `beta = 70,665924`, média de 84,25444 mm e desvio-padrão
   de 30,193146 mm. Esses valores reproduzem a média informada pela ficha
   (`beta + gamma * alpha`, com `gamma` igual à constante de
   Euler–Mascheroni).
3. O total diário é convertido para uma janela de 24 horas pelo fator fixo
   **1,13**.
4. A chuva de 24 horas é desagregada para as durações de 5, 10, 15, 20, 25,
   30, 60, 360, 480, 600, 720 e 1.440 minutos pela cascata
   **DAEE/CETESB**. Os coeficientes publicados no release incluem, por exemplo,
   5 min/30 min = 0,34; 15 min/30 min = 0,70; 1 h/24 h = 0,42; 12 h/24 h =
   0,85. A configuração completa está disponível na resposta `/api/v1/version`.
5. Para cada modelo climático, a mesma distribuição é ajustada na janela
   histórica **1950–2014** e na janela futura selecionada. O fator de mudança é
   a razão entre o quantil futuro e o quantil histórico do próprio modelo, no
   mesmo tempo de retorno.
6. Os fatores dos modelos válidos são resumidos pelos percentis **p10, p50 e
   p90**, acompanhados da quantidade de modelos. Nesta convenção, p10 é a faixa
   branda, p50 é a mediana e p90 é a faixa severa para chuva, fator e IDF.
7. A chuva futura é obtida pela multiplicação da chuva observada de projeto pelo
   fator de mudança. Como o fator é aplicado antes da desagregação, a IDF futura
   resulta da IDF do presente multiplicada pelo mesmo fator.
8. O portal também fornece o **tempo de retorno futuro equivalente**, que responde
   a uma pergunta diferente: com que frequência futura ocorre o evento que hoje
   tem determinado tempo de retorno. Para essa métrica, a severidade é espelhada:
   o pior caso é o menor tempo de retorno.

## Cenários, períodos e aplicação em Conde

São considerados os cenários CMIP6 `ssp126`, `ssp245`, `ssp370` e `ssp585`, nos
períodos:

- P1: 2015–2040;
- P2: 2041–2070;
- P3: 2071–2100.

A linha de base operacional do SWMM permanece identificada como `BASE_TR25` e
`BASE_TR50`, conforme a rodada hidrológica tradicional do relatório anterior.
Os fatores IDF-MC são aplicados como famílias de sensibilidade:

- `IDFMC_[cenario]_P[periodo]_TR25`: coletores e bueiros;
- `IDFMC_[cenario]_P[periodo]_TR50`: troncos principais e dissipadores.

O arquivo [idf_mc_conde_tr25_tr50.csv](idf_mc_conde_tr25_tr50.csv) é uma cópia
auditável dos fatores publicados para as duas recorrências. A fonte canônica é
sempre a [ficha oficial de Conde](https://idf-mc.dpm-sedec-sas.tech/api/v1/municipios/2504603).

## Integração com o SWMM

Os fatores não devem substituir automaticamente os hietogramas tradicionais.
Para cada cenário e período, a sequência de trabalho é:

1. manter intacta a rodada-base TR25/TR50;
2. obter a chuva de projeto futura pelo fator IDF-MC correspondente;
3. preservar a distribuição temporal da IDF adotada, documentando que a fonte
   climática parte de máximas diárias e não de uma série pluviográfica subdiária;
4. executar o SWMM em arquivo separado;
5. comparar pico, volume, lâmina/nós inundados, capacidade, velocidade, saída e
   vazão nos dissipadores;
6. registrar os trechos que permanecem críticos em p10, p50 e p90 e nos
   cenários selecionados.

Para o Plano de Trabalho, o critério não será escolher o cenário mais severo de
forma automática. Serão priorizados trechos que reduzam risco nas metas e que
apresentem desempenho robusto, ou que possam receber reforço futuro, manutenção
e adaptação sem refazer todo o sistema.

## Limitações e salvaguardas

- O IDF-MC trabalha com valores de grade; eles representam uma área e não um
  pluviômetro pontual.
- A baseline municipal é baseada em máximas diárias de 1981–2024. A chuva curta
  é derivada pela cascata DAEE/CETESB e não substitui uma IDF construída com
  pluviografia local.
- A mediana não é uma previsão determinística. A dispersão p10–p90 e a
  quantidade de modelos devem acompanhar cada número.
- A ficha de Conde registra um aviso de não monotonicidade entre cenários no
  período mais distante; isso deve ser lido como incerteza do conjunto, não como
  erro a ser escondido.
- Tempos de retorno muito acima do tamanho da série observada são extrapolações.
  O release recomenda 2, 5, 10, 25, 50 e 100 anos; TR200 deve ser identificado
  como fora da faixa recomendada.
- O resultado é apropriado para análise de robustez e adaptação da concepção.
  O projeto básico/executivo deverá confirmar topografia, cadastro, áreas
  contribuintes, parâmetros de perdas, condições de jusante, hietogramas e
  critérios hidráulicos.

## Referências

- SEDEC/MIDR. [Portal IDF-MC — Chuva de projeto sob mudança do clima](https://idf-mc.dpm-sedec-sas.tech/).
- SEDEC/MIDR. [Metodologia do Portal IDF-MC](https://idf-mc.dpm-sedec-sas.tech/metodologia).
- SEDEC/MIDR. [API — ficha de Conde/PB](https://idf-mc.dpm-sedec-sas.tech/api/v1/municipios/2504603).
- Maity, R.; Maity, S. (2022). *Changing Pattern of Intensity-Duration-Frequency Relationship of Precipitation due to Climate Change*. DOI: [10.1007/s11269-022-03313-y](https://doi.org/10.1007/s11269-022-03313-y).
- NRCC/Cornell. [NY Projected IDF Curves](https://ny-idf-projections.nrcc.cornell.edu/).
