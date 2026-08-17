# Camadas consolidadas das redes A e B

CRS: SIRGAS 2000 / UTM 25S (EPSG:31985).

## Arquivos principais
- `rede_consolidada_AB.gpkg`: camadas `trechos_rede_AB`, `nos_rede_AB`, `dissipadores_AB` e camadas separadas A/B.
- `shp_arcmap/trechos_rede_AB.shp`: trechos para ArcMap, com campos curtos e dimensoes da primeira rodada SWMM.
- `shp_arcmap/nos_rede_AB.shp`: nos, cotas de superficie, tipo e indicador de outfall.
- `shp_arcmap/dissipadores_AB.shp`: trechos de dissipacao/saida, vazoes TR25/TR50 e status de revisao.
- `shp_arcmap/poligonos_metas_AB_template.shp`: camada vazia para desenhar as areas das metas.

## Campos para selecionar metas
`SELEC_META` e `META_ID` estao vazios/nao selecionados na camada-base. Depois de desenhar os poligonos, use Select By Location no ArcMap para identificar os trechos e copie o resultado para uma camada de trabalho.

## Dimensoes
`D_ATUAL_M` e o placeholder que entrou no modelo; `DREQ25`/`DREQ50` sao diametros teoricos requeridos; `DNOM25`/`DNOM50` sao candidatos nominais; `DPROP_M` e o maior candidato nominal disponivel. Todos sao PRELIM_SWMM e nao substituem cotas de fundo, cadastro, projeto estrutural, verificacao de jusante ou campo.

## Regra de identificacao
Os IDs iniciados por `L_A_`, `N_A_`, `DISS_` pertencem a Bacia A; os iniciados por `L_B_`, `N_B_`, `DISS_B_` pertencem a Bacia B. Conectores `L_*_C*` sao topologicos e nao devem ser convertidos automaticamente em obras.
