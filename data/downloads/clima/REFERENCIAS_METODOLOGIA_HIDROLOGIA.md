# Referências e rastreabilidade da hidrologia — Conde/PB

Este arquivo acompanha a minuta do relatório e registra a função de cada referência. A classificação usada é:

- **adotada nesta versão**: a fonte ou procedimento participa diretamente dos arquivos produzidos;
- **referência de apoio**: orienta a formulação, mas não fornece diretamente um número aplicado ao modelo;
- **pendente de incorporação**: deve ser anexada ou executada antes de tratar o resultado como dimensionamento de projeto básico.

## Referências adotadas nesta versão

1. **Relação IDF SGB/CPRM 2023 preservada no relatório anterior.** É a origem declarada da equação `i = 1424,1 x Tr^0,1305 / (t + 23,6)^0,7468` usada na linha de base. O documento primário do ajuste e a série observada completa ainda não estão anexados ao pacote; por isso, os coeficientes são tratados como herdados e os indicadores independentes de ajuste são `null`/não determinados nesta minuta.
2. **Estação INMET 82798.** É a referência observacional indicada para a linha de base tradicional. A identificação da estação foi preservada, mas a série bruta, o controle de qualidade e a memória do ajuste precisam ser incorporados para uma reanálise independente. Portal de dados: [INMET — dados históricos](https://portal.inmet.gov.br/dadoshistoricos).
3. **SNIRH/ANA — Curva Número na Base Ottocodificada.** O recorte de 2022 é usado como referência espacial preliminar do CN para as Bacias A e B. [Registro oficial do metadado](https://metadados.snirh.gov.br/geonetwork/srv/api/records/d1c36d85-a9d5-4f6a-85f7-71c2dc801a67).
4. **EPA SWMM.** Os arquivos preliminares usam a estrutura do SWMM, infiltração `CURVE_NUMBER`, `Rain Gage`, séries de 5 minutos e roteamento dinâmico. [Página oficial do SWMM](https://www.epa.gov/water-research/storm-water-management-model-swmm) e [User’s Manual 5.2](https://www.epa.gov/system/files/documents/2022-04/swmm-users-manual-version-5.2.pdf).
5. **Chuvas de projeto tradicionais.** Os hietogramas `BASE_TR25` e `BASE_TR50` foram preservados do arquivo [chuvas_TR25_TR50_base_relatorio.txt](chuvas_TR25_TR50_base_relatorio.txt), com total, passo e pico verificados no script de geração das tabelas e gráficos.

## Referências metodológicas de apoio

6. **USDA-NRCS, National Engineering Handbook, Chapter 05 — Stream Hydrology.** Dá suporte à interpretação de bacia, chuva, escoamento e parâmetros hidrológicos. [Documento institucional](https://directives.nrcs.usda.gov/sites/default/files2/1720613219/Chapter%2005%20-%20Stream%20Hydrology.pdf).
7. **Pfafstetter, O. (1957), Chuvas intensas no Brasil.** Referência histórica brasileira para relações de chuvas intensas, registrada na nota técnica de IDF usada como inspiração.
8. **Nota técnica de IDF do RS, `idf_RS_Technical_Note2.qmd`.** Foi usada como referência de estrutura: máximas anuais, distribuições de extremos, equação `i = a Tr^b/(t+c)^d`, documentação de falhas e apresentação. Dados, coeficientes e resultados do RS não foram usados no modelo de Conde.
9. **Maity, R.; Maity, A. (2022).** *Changing Pattern of Intensity–Duration–Frequency Relationship of Precipitation due to Climate Change*. *Water Resources Management*, 36, 5371–5399. [DOI](https://doi.org/10.1007/s11269-022-03313-y). É a referência de desenho para correção de viés, extremos, cenários e incerteza; os parâmetros do artigo não são transferidos para Conde.
10. **NASA NEX-GDDP-CMIP6.** A base em grade orienta a análise de sensibilidade climática diária por GCM, cenário e horizonte. [Página da coleção](https://nccs.smce.nasa.gov/data-collections/nex-gddp-cmip6/) e [nota técnica](https://www.nccs.nasa.gov/sites/default/files/NEX-GDDP-CMIP6-v2-Tech_Note.pdf).

## Procedimentos pendentes antes do projeto básico

- anexar a série observada da estação 82798 e a memória primária do ajuste IDF;
- documentar falhas, anos incompletos, homogeneidade e independência das máximas;
- comparar Gumbel e GEV com método de estimação, teste de aderência e intervalos de confiança;
- avaliar a sensibilidade espacial dos quatro pontos NEX próximos às Bacias A+B;
- incorporar a série diária completa para quantile mapping, se essa etapa for adotada;
- validar a transformação diária–subdiária e os hietogramas futuros;
- revisar CN, impermeabilização, áreas de contribuição, tempos de percurso e condições de jusante no SWMM;
- conferir em campo cotas, seções, material, obstruções e dissipadores.

## Regra de interpretação

Os valores calculados nesta concepção são adequados para comparar alternativas, localizar gargalos e estruturar metas do Plano de Trabalho. Eles não devem ser apresentados como especificações executivas enquanto as fontes primárias e as verificações acima não estiverem anexadas e auditadas.
