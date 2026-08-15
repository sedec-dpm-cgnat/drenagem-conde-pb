# Guia de validação paralela no SWMM — Bacia A

## Objetivo

Validar a rede desenhada no GIS antes de fechar o modelo hidrológico-hidráulico. Os arquivos atuais são modelos de partida, não modelos finais de contratação.

## Arquivos de partida

- CONDE_BACIA_A_REDE_PRELIM_TR25.inp
- CONDE_BACIA_A_REDE_PRELIM_TR50.inp

A estrutura atual contém 187 conduítes, 160 junctions, 40 outfalls provisórios e 208 subcatchments. As seções circulares usam 0,60 m e 0,80 m como valores preliminares. Esses diâmetros, a rugosidade, as cotas de fundo e as áreas de contribuição ainda precisam ser validados.

## Procedimento recomendado

1. Abra primeiro uma cópia do arquivo TR25 e salve como modelo de revisão. Preserve os arquivos PRELIM originais.
2. Abra o mapa da rede e use a identificação dos links L_A_#### e dos nós N_A_#### para conferir cada trecho contra o shapefile/GPKG do GIS.
3. Para cada link, registre em uma planilha ou camada de controle:
   - ID do link;
   - classe: TRONCO ou COLETOR;
   - nó de montante;
   - nó de jusante;
   - rua/quadra;
   - comprimento conferido;
   - sentido do escoamento;
   - cota de terreno;
   - cota de fundo de entrada e saída;
   - diâmetro/seção;
   - material e Manning;
   - saída ou dissipador associado;
   - observação e fonte da informação.
4. Confira o sentido do link. O nó de montante deve estar hidraulicamente acima do nó de jusante, salvo quando houver estrutura de controle, recalque ou outra justificativa explícita.
5. Confira os nós:
   - cruzamentos devem ter o mesmo ponto topológico;
   - nós duplicados ou muito próximos devem ser identificados;
   - nós sem link de entrada ou saída devem ser listados;
   - o nó de saída não deve permanecer como outfall apenas porque foi criado automaticamente.
6. Revise os 40 outfalls provisórios. Para cada um, defina se é:
   - saída real;
   - início/fim de dissipador;
   - continuidade ainda não desenhada;
   - componente desconectado;
   - outfall a excluir.
7. Verifique as 208 subáreas. Não redesenhe suas áreas diretamente no SWMM se a geometria precisa ser alterada: edite no ArcMap/QGIS, vincule cada área ao nó correto e depois regenere o INP.
8. Revise os valores preliminares:
   - diâmetros de 0,60 m e 0,80 m;
   - Manning 0,013;
   - CN médio 79;
   - 30% de impermeabilização;
   - declividades e cotas derivadas do MDT.
   Mantenha o valor original em coluna de controle e substitua somente quando houver fonte.
9. Rode primeiro o TR25 apenas como teste de consistência. Depois rode o TR50. Não use ainda os resultados para fechar metas se a rede estiver desconectada ou se houver subáreas sem vínculo.
10. No relatório do SWMM, verifique:
    - erro de continuidade;
    - nós com alagamento;
    - links sobrecarregados;
    - velocidades;
    - profundidades e níveis;
    - vazões nos outfalls;
    - vazões nos trechos que chegarão aos dissipadores.
11. Salve os arquivos de resultado com a mesma versão do modelo:
    - INP;
    - RPT;
    - OUT;
    - planilha ou tabela de resultados;
    - mapa de trechos críticos.

## O que não alterar manualmente agora

Não faça ainda:

- conexão automática dos cinco trechos de dissipação;
- transformação dos 40 outfalls em saídas definitivas;
- dimensionamento estrutural de escadas ou bacias;
- aceitação dos diâmetros preliminares como dimensionamento;
- substituição da chuva tradicional por fator climático;
- uso do template Voronoi como delimitação final das quadras.

## Entrega para a próxima rodada

Depois da conferência, salve no GIS uma versão com os campos:

| Campo | Conteúdo |
|---|---|
| ID_LINK | identificador estável do link |
| CLASSE | TRONCO ou COLETOR |
| NO_IN | nó de início |
| NO_FIM | nó de fim |
| ID_DISS | dissipador/saída associado ou null |
| STATUS | VALIDADO, AJUSTAR, EXCLUIR ou NOVO |
| FONTE_COTA | MDT, levantamento, cadastro ou null |
| DIAM_M | diâmetro confirmado ou null |
| MANNING | rugosidade confirmada ou null |
| OBS | justificativa e observações |

Envie a camada editada e a tabela de controle. A partir dela, a versão do SWMM será regenerada de forma consistente para a Bacia A e, depois, para a Bacia B.

## Critério para chamar uma versão de final

Um modelo somente será chamado de final depois de:

- topologia validada;
- áreas de contribuição revisadas;
- cotas e seções conferidas;
- saídas e dissipadores definidos;
- TR25 e TR50 executados;
- resultados revisados;
- arquivos INP, RPT e OUT arquivados;
- limitações e responsáveis registrados.

