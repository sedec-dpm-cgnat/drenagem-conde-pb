# Metodologia de atualizacao das curvas IDF sob mudanca climatica

## Referencia metodologica

A metodologia de referencia sera Maity e Maity (2022), *Changing Pattern of Intensity-Duration-Frequency Relationship of Precipitation due to Climate Change*, Water Resources Management, DOI 10.1007/s11269-022-03313-y.

O artigo combina: (i) correcao de vies dos modelos climaticos por quantile mapping; (ii) ponderacao do conjunto de modelos pelo Reliability Ensemble Averaging (REA); (iii) ajuste de extremos por GEV usando L-moments; (iv) relacao de escala entre duracao diaria e subdiaria; e (v) comparacao entre IDF historica e IDF futura por cenario, horizonte e periodo de retorno.

## Adaptacao necessaria para Conde/PB

O banco local NEX-GDDP-CMIP6 disponibiliza `prec_max_anual`, isto e, a maxima precipitacao diaria de cada ano por modelo, cenario e ponto de grade. Ele nao disponibiliza, nesta tabela, a serie diaria completa nem a serie subdiaria.

Por isso, a aplicacao para Conde nao sera uma copia literal do artigo. A Gamma-QM para toda a distribuicao diaria e a extracao direta de janelas moveis de 1, 2, 3, 6, 9, 12 e 24 horas nao podem ser reproduzidas somente com `prec_max_anual`. A versao adotada sera uma adaptacao paramétrica para extremos anuais, combinada com a IDF observada/tradicional usada no SWMM.

## Procedimento proposto

### 1. Recorte espacial e series

1. Identificar o ponto de grade mais proximo do centroide das Bacias A e B e, como verificacao de sensibilidade, os quatro pontos vizinhos mais proximos.
2. Extrair, para os 34 GCMs, os cenarios `historical`, `ssp126`, `ssp245`, `ssp370` e `ssp585`.
3. Construir as series de maxima anual para o periodo historico de 1950-2014 e para os horizontes futuros. Para comparabilidade com o artigo, manter 2015-2039, 2040-2059 e 2060-2100; para a tomada de decisao atual, destacar tambem uma janela operacional centrada no horizonte de projeto definido pelo municipio.
4. Manter a separacao entre Bacia A e Bacia B no modelo hidrologico, mas usar a mesma chuva de projeto quando a escala espacial da grade nao permitir distinguir as duas bacias.

### 2. Referencia observada e correcao de vies

1. Usar a serie observada que fundamentou a IDF tradicional do relatorio, com a estacao e o procedimento documentados no projeto.
2. Ajustar, para cada GCM, a distribuicao historica de maxima anual do modelo contra a distribuicao observada de maxima anual.
3. Fazer a transferencia para o futuro por quantile mapping parametrico. O ajuste de extremos sera feito por GEV; se a amostra observada nao suportar estimativa estavel do parametro de forma, usar forma fixa e reportar a analise de sensibilidade.
4. A correcao sera avaliada por quantis, viés, RMSE, erro relativo nos quantis de projeto e teste de aderencia. A serie historica sera dividida temporalmente para uma validacao fora da amostra, sempre que o tamanho permitir.

Esta etapa e equivalente ao principio do artigo, mas substitui o QM misto Gamma-Gumbel por uma correcao paramétrica focada nas maximas anuais, porque o banco entregue nao contem os valores diarios nao extremos nem os zeros necessarios para o componente Gamma.

### 3. Extremos e REA

1. Ajustar a GEV as series de maxima anual por L-moments.
2. Usar como configuracao principal a forma fixa κ = 0,114, conforme a referencia metodologica, e executar uma sensibilidade com forma estimada quando a amostra permitir.
3. Calcular os niveis de retorno para TR 2, 5, 10, 25, 50 e 100 anos.
4. Calcular pesos REA por desempenho historico e convergencia futura. O desempenho sera medido pelo RMSE entre as CDFs historicas do modelo e da referencia, avaliadas em 100 quantis igualmente espacados. Os pesos serao normalizados e iterados ate a convergencia.
5. Publicar, alem da curva REA, a mediana do conjunto e a faixa de incerteza entre os percentis 10 e 90 dos GCMs. Nenhum cenario sera representado por um unico fator sem essa faixa.

### 4. Conversao para duracoes usadas no SWMM

Como o banco fornece maxima diaria, a escala subdiaria sera obtida a partir da IDF tradicional observada e da relacao de escala. A forma geral sera:

`I_T(lambda t) = lambda^theta I_T(t)`

O expoente `theta` sera estimado com as duracoes disponiveis na IDF observada e validado contra as duracoes mais curtas usadas no modelo. Assim, a informacao climatica do NEX-GDDP altera o nivel diario de extremos, enquanto a estrutura temporal subdiaria permanece ancorada na observacao local e na IDF tradicional.

As duracoes de trabalho serao compativeis com o SWMM, por exemplo 5, 10, 15, 30, 60, 120, 180, 360, 720 e 1440 minutos, com interpolacao documentada quando necessario.

### 5. Aplicacao no SWMM

Para cada combinacao de cenario, horizonte e TR:

1. gerar a curva IDF futura;
2. construir o hietograma de projeto mantendo a distribuicao temporal tradicional;
3. registrar a chuva em uma nova serie temporal do INP;
4. executar separadamente Bacia A e Bacia B;
5. comparar vazao de pico, volume, nivel, inundacao, velocidade e vazao nos dissipadores com a rodada historica TR25/TR50;
6. registrar quais trechos mudam de classe de atendimento e quais passam a ser metas prioritarias do Plano de Trabalho.

Os arquivos climaticos nao substituirão a rodada historica. O modelo devera manter uma linha de base e cenarios climaticos identificados, por exemplo `BASE_TR25`, `BASE_TR50`, `SSP245_2040_TR25` e `SSP585_2060_TR50`.

## Salvaguardas e limitacoes

- NEX-GDDP-CMIP6 e uma projecao de grade, nao uma medicao local.
- A grade de 0,25 grau e muito mais grosseira que as Bacias A e B; a representatividade espacial sera reportada.
- A tabela de maxima anual nao permite reconstruir diretamente a duracao subdiaria do evento futuro.
- A correcao de vies nao elimina a incerteza estrutural dos GCMs.
- Os resultados devem ser apresentados como faixas e cenarios, nao como previsao deterministica.
- A primeira rodada no SWMM continuara preliminar ate a validacao das areas de contribuicao, cotas de fundo, diametros, sentidos e dissipadores.

## Verificacao inicial do banco NEX-GDDP-CMIP6

Foi realizada uma consulta de leitura em 15/08/2026. O centroide calculado para a Bacia A foi aproximadamente -34,91727 / -7,26402. O ponto de grade mais proximo foi o `grid_id 6931`, em -34,87500 / -7,37500, a aproximadamente 13,19 km do centroide. Os quatro pontos mais proximos devem ser mantidos na analise de sensibilidade, em vez de tratar o ponto mais proximo como observacao local.

No ponto mais proximo, o banco retornou cobertura historica de 1950-2014 e cobertura futura de 2015-2100 para os quatro cenarios SSP. A quantidade de registros varia por cenario, modelo e ano; a auditoria de completude sera feita antes do ajuste estatistico.

## Saidas previstas

- `idf_historica_referencia.csv`;
- `idf_futura_por_modelo.csv`;
- `idf_futura_ensemble_rea.csv`;
- `fatores_mudanca_climatica.csv`;
- `pesos_rea_por_modelo.csv`;
- graficos das curvas IDF historica, mediana, REA e faixa P10-P90;
- INP, RPT e OUT separados por cenario e horizonte;
- tabela de trechos criticos e metas candidatas do Plano de Trabalho.
