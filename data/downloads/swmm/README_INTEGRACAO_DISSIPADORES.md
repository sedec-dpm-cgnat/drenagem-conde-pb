# Integração de pontos de saída e dissipação no SWMM

## Como entregar o shapefile

Coloque o shapefile de pontos, com todos os arquivos laterais (`.shp`, `.shx`, `.dbf`, `.prj`), em uma pasta de entrada do projeto. O CRS preferencial é **SIRGAS 2000 / UTM 25S — EPSG:31985**. Se vier em outro CRS, a cópia de trabalho será reprojetada; o original será preservado.

O arquivo pode conter somente geometria de ponto, mas a integração fica mais segura se incluir estes campos:

### Camada recebida em 15/08/2026

Foi recebida a camada de linhas `E:\SEDEC\Paraiba\GIS\06_PROJETOS_ARCMAP\TrechosDissipacao.shp`, com cinco trechos, em EPSG:31985. O campo `Id` está preenchido com `0` em todas as feições; por isso, serão atribuídos identificadores internos estáveis (`DISS_01` a `DISS_05`) somente na cópia de trabalho, preservando o original.

A análise espacial preliminar associou quatro extremidades exatamente aos nós `N_A_0200`, `N_A_0190`, `N_A_0191` e `N_A_0193`. O quinto trecho se aproxima do nó `N_A_0195`, mas deve ser revisado antes de qualquer snap automático, pois suas extremidades estão afastadas aproximadamente 28 m e 71 m do nó mais próximo.

Essas cinco linhas correspondem a cinco dos dezesseis componentes conectados da rede nodal atual. A integração deverá garantir que os demais componentes tenham caminho hidráulico para uma dessas saídas, ou registrar explicitamente a sua exclusão/necessidade de nova saída.

| Campo | Tipo | Uso |
|---|---|---|
| `ID_DISS` | texto | Identificação de campo ou do mapa |
| `TIPO` | texto | `DISSIPADOR`, `ESCADA`, `SAIDA` ou `OUTFALL` |
| `N_DEGRAUS` | inteiro | Número de degraus, quando for uma escada |
| `DESNIVEL_M` | decimal | Desnível total da estrutura |
| `LARGURA_M` | decimal | Largura hidráulica útil |
| `COTA_ENT` | decimal | Cota de entrada, se conhecida |
| `COTA_SAI` | decimal | Cota de saída, se conhecida |
| `Q_PROJ` | decimal | Vazão de referência, se já definida |
| `OBS` | texto | Observações de campo ou de projeto |

Campos ausentes serão registrados como `null`; não serão inventados valores de projeto. Se o arquivo tiver apenas pontos, a estrutura será integrada como **elemento preliminar** e ficará marcada para complementação geométrica.

## Procedimento de integração

1. Reprojetar a cópia para EPSG:31985.
2. Associar cada ponto ao link mais próximo, com tolerância inicial de 2 m.
3. Se o ponto cair no meio de um link, dividir o link e inserir um nó hidráulico.
4. Se estiver a mais de 2 m da rede, emitir alerta e não conectar automaticamente.
5. Classificar o trecho anterior e posterior, preservando a classe original (`TRONCO` ou `COLETOR`).
6. Criar a estrutura hidráulica adequada no `.inp`.
7. Validar continuidade, códigos únicos, nós órfãos, sentido do escoamento e saídas.

## Representação preliminar no SWMM

O SWMM não possui um objeto único chamado “escada de dissipação”. A representação será feita com elementos hidráulicos equivalentes:

- `SAIDA`/`OUTFALL`: nó de saída com condição de jusante explicitada;
- `DISSIPADOR`: nó de entrada e elemento de controle (`WEIR`, `ORIFICE` ou `OUTLET`) conforme os dados disponíveis;
- `ESCADA`: sequência de nós intermediários e elementos de controle, com queda distribuída entre os degraus quando `N_DEGRAUS` e `DESNIVEL_M` estiverem informados;
- ausência de geometria: estrutura equivalente provisória, marcada no relatório e não considerada solução executiva.

O tipo final — vertedor, orifício, saída livre, canal curto ou combinação — dependerá da função da estrutura e das informações de cota, largura, desnível e vazão. A modelagem preliminar não substitui o detalhamento hidráulico e estrutural da dissipação.

## Padrão de códigos

Os códigos serão curtos, sem acentos e estáveis entre GIS e SWMM:

| Objeto | Padrão | Exemplo |
|---|---|---|
| Nó comum | `A-N-####` | `A-N-0042` |
| Tronco | `A-TR-####` | `A-TR-0017` |
| Coletor | `A-CO-####` | `A-CO-0086` |
| Dissipador | `A-DI-###` | `A-DI-003` |
| Degrau da escada | `A-DI-###-##` | `A-DI-003-02` |
| Exutório | `A-EX-###` | `A-EX-004` |
| Subcatchment | `A-SC-####` | `A-SC-0128` |

Cada feição também manterá `ORIGEM`, `ID_DISS` ou o identificador anterior, permitindo voltar do código SWMM ao desenho original no ArcMap.

## Verificações após a integração

Antes de rodar a simulação serão reportados:

- pontos vinculados e não vinculados;
- distância do ponto ao link original;
- quantidade de links divididos;
- estruturas por tipo;
- nós e links sem cota;
- componentes desconectados;
- exutórios e condições de jusante;
- balanço de massa e continuidade do SWMM;
- eventuais sobrecargas e alagamentos na vizinhança das dissipações.
