# Relatório digital — Drenagem Conde/PB

Este diretório é o esqueleto local do relatório técnico em Quarto/GitHub Pages.

## Minuta e autoria

O relatório está sendo preparado como minuta técnica preliminar para instruir o Plano de Trabalho de Reconstrução do Município de Conde/PB.

## Autores

- **Cássio Guilherme Rampinelli, PhD** — Coordenador Geral de Prevenção e Mitigação de Desastres Naturais, Departamento de Prevenção e Mitigação de Desastres, Secretaria Nacional de Proteção e Defesa Civil.
- **Saulo Aires de Souza, PhD** — Diretor do Departamento de Prevenção e Mitigação de Desastres, Secretaria Nacional de Proteção e Defesa Civil.

O escopo inicial prioriza troncos principais, coletores indispensáveis e dissipadores em setores críticos, sem propor a implantação imediata de toda a rede municipal. A página `07_plano_trabalho.qmd` registra as metas preliminares e a estratégia de enquadramento federal.

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

O relatório está publicado em `https://sedec-dpm-cgnat.github.io/drenagem-conde-pb/`, associado ao repositório `sedec-dpm-cgnat/drenagem-conde-pb`. O deploy continuará sendo feito progressivamente, após cada revisão relevante.

O relatório está em construção e será atualizado progressivamente à medida que a rede, as áreas de contribuição, os dissipadores e os resultados do SWMM forem revisados.
