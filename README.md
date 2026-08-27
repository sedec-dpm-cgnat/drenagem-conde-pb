# Da Reconstrução à Prevenção Resiliente: Estudo de Caso sobre Drenagem Urbana adaptada à Mudança Climática em Conde/PB

Este diretório reúne o relatório técnico digital sobre drenagem urbana resiliente e adaptação climática em Conde/PB.

## Minuta e autoria

O relatório está sendo preparado como minuta técnica preliminar para instruir o Plano de Trabalho de Reconstrução do Município de Conde/PB.

## Autores

- **Cássio Guilherme Rampinelli, PhD** — Coordenador Geral de Prevenção e Mitigação de Desastres Naturais, Departamento de Prevenção e Mitigação de Desastres, Secretaria Nacional de Proteção e Defesa Civil.
- **Saulo Aires de Souza, PhD** — Diretor do Departamento de Prevenção e Mitigação de Desastres, Secretaria Nacional de Proteção e Defesa Civil.

O escopo inicial prioriza troncos principais, coletores indispensáveis e dissipadores em setores críticos, sem propor a implantação imediata de toda a rede municipal. A página `07_plano_trabalho.html` organiza três metas administrativas: Meta 1 (antiga META_04, Bacia A), Meta 2 (antiga META_02, Bacia B) e Meta 3 (fusão das antigas META_01 e META_03, Bacia B). Os polígonos originais são preservados para auditoria; os envelopes formatados são apenas de apresentação.

O mapa de suscetibilidade à erosão foi reincorporado à minuta. O cruzamento dos pontos originais identificou 10 de 12 metas dentro das Bacias A/B e quatro coincidências diretas com as manchas de suscetibilidade. As ocorrências fora desse recorte permanecem documentadas, mas não integram os quantitativos desta análise.

## Identidade visual adotada

- azul institucional SEDEC/ICPM: `#16224e`;
- fundo creme: `#f4f0e7`;
- laranja de destaque: `#994b00`;
- teal de apoio cartográfico: `#187d78`;
- tipografia: IBM Plex Sans com fallback de sistema;
- logos locais da Defesa Civil e do DPM em `assets/logos`.

## Renderização local

Na pasta `08_RELATORIO_SITE`, executar:

```powershell
python scripts/build_public_data.py
quarto render
```

A versão HTML do relatório digital será gerada em `_site`. O script prepara os limites das Bacias A e B, arquivos KMZ, GeoPackages, shapefiles compactados e os MDTs híbridos públicos.

## Situação de publicação

O relatório está publicado em [https://sedec-dpm-cgnat.github.io/drenagem-conde-pb/](https://sedec-dpm-cgnat.github.io/drenagem-conde-pb/), associado ao repositório [sedec-dpm-cgnat/drenagem-conde-pb](https://github.com/sedec-dpm-cgnat/drenagem-conde-pb). O deploy continuará sendo feito progressivamente, após cada revisão relevante.

O relatório está em construção e será atualizado progressivamente à medida que a rede, as áreas de contribuição, os dissipadores e os resultados do SWMM forem revisados.

## Mudança climática e IDF-MC

A partir da revisão de 25/08/2026, o capítulo climático adota como fonte primária
o [Portal IDF-MC da SEDEC/MIDR](https://idf-mc.dpm-sedec-sas.tech/). A ficha de
[Conde/PB](https://idf-mc.dpm-sedec-sas.tech/api/v1/municipios/2504603) está
publicada no release `2026.08.002`. Os fatores oficiais para TR25 e TR50, por
cenário, período e p10/p50/p90, estão em
[`idf_mc_conde_tr25_tr50.csv`](data/downloads/clima/idf_mc_conde_tr25_tr50.csv),
com metadados em
[`idf_mc_conde_metadados.json`](data/downloads/clima/idf_mc_conde_metadados.json).
As tabelas NEX-GDDP/GEV anteriores permanecem no acervo como material
exploratório e não devem ser confundidas com a fonte oficial desta revisão.
