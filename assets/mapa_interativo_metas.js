(function () {
  "use strict";

  const container = document.getElementById("mapa-interativo-metas");
  if (!container) return;

  const mensagem = (texto) => {
    container.innerHTML = '<div class="leaflet-fallback">' + texto + "</div>";
  };
  if (typeof L === "undefined") {
    mensagem("O mapa interativo depende da biblioteca Leaflet. As camadas para ArcMap/QGIS continuam disponíveis na página de dados.");
    return;
  }

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));

  const cores = { META_01: "#c35416", META_02: "#087f7b", META_03: "#6f42c1" };
  const nomesMetas = { META_01: "Meta 1", META_02: "Meta 2", META_03: "Meta 3" };
  const nomeMeta = (codigo) => nomesMetas[codigo] || codigo || "Meta";
  const map = L.map(container, { scrollWheelZoom: false, preferCanvas: true });
  const satelite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "&copy; Esri, Maxar, Earthstar Geographics e colaboradores" },
  ).addTo(map);
  const ruas = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" },
  );

  const limites = L.layerGroup().addTo(map);
  const originais = L.layerGroup();
  const formatados = L.layerGroup().addTo(map);
  const redeA = L.layerGroup().addTo(map);
  const redeB = L.layerGroup().addTo(map);
  const dissipadores = L.layerGroup().addTo(map);
  const pontos = L.layerGroup();

  const carregar = (arquivo, destino, opcoes) => fetch(arquivo)
    .then((resposta) => {
      if (!resposta.ok) throw new Error(arquivo + " — HTTP " + resposta.status);
      return resposta.json();
    })
    .then((dados) => {
      const camada = L.geoJSON(dados, opcoes);
      camada.addTo(destino);
      return camada;
    });

  const popupMeta = (p) => [
    "<strong>", escapeHtml(nomeMeta(p.META_ID)), " (", escapeHtml(p.META_ID), ")</strong>",
    "<br>", escapeHtml(p.NOME),
    "<br>Bacia: ", escapeHtml(p.BACIA),
    "<br>Polígonos originais: ", escapeHtml(p.POLIGONOS_ORIG),
    "<br>Dissipador: ", escapeHtml(p.DISS_USUARIO),
    "<br>Etapas: ", escapeHtml(p.ETAPAS),
    "<br><em>Envelope esquemático — não usar para seleção analítica.</em>",
  ].join("");

  const popupOriginal = (p) => [
    "<strong>", escapeHtml(p.META_ORIG), "</strong>",
    "<br>Meta administrativa: ", escapeHtml(p.META_FINAL),
    "<br>Bacia: ", escapeHtml(p.BACIA),
    "<br><em>Polígono original preservado para auditoria e seleção espacial.</em>",
  ].join("");

  const estiloBacia = (cor) => ({ color: cor, weight: 2, fillColor: cor, fillOpacity: 0.06, dashArray: "6 5" });
  const estiloRede = (bacia, classe) => {
    const cor = bacia === "A" ? "#c35416" : "#087f7b";
    if (classe === "COLETOR") return { color: cor, weight: 2.2, opacity: 0.92, dashArray: "8 6" };
    return { color: cor, weight: 3.4, opacity: 0.97 };
  };

  const tarefas = [
    carregar("data/bacia_A.geojson", limites, { style: estiloBacia("#c35416"), onEachFeature: (_, l) => l.bindPopup("<strong>Bacia A</strong><br>Unidade de drenagem de trabalho") }),
    carregar("data/bacia_B.geojson", limites, { style: estiloBacia("#087f7b"), onEachFeature: (_, l) => l.bindPopup("<strong>Bacia B</strong><br>Unidade de drenagem de trabalho") }),
    carregar("data/metas_plano_trabalho/metas_selecionadas_original.geojson", originais, {
      style: (f) => ({ color: cores[f.properties?.META_FINAL] || "#4b5563", weight: 2, fillColor: cores[f.properties?.META_FINAL] || "#4b5563", fillOpacity: 0.08, dashArray: "5 5" }),
      onEachFeature: (f, l) => l.bindPopup(popupOriginal(f.properties || {})),
    }),
    carregar("data/metas_plano_trabalho/metas_administrativas_display.geojson", formatados, {
      style: (f) => ({ color: cores[f.properties?.META_ID] || "#4b5563", weight: 3, fillColor: cores[f.properties?.META_ID] || "#4b5563", fillOpacity: 0.18 }),
      onEachFeature: (f, l) => {
        l.bindPopup(popupMeta(f.properties || {}));
        l.bindTooltip(nomeMeta(f.properties?.META_ID), { sticky: true });
      },
    }),
    carregar("data/rede_linhas_A_nodal.geojson", redeA, { style: (f) => estiloRede("A", f.properties?.classe) }),
    carregar("data/rede_linhas_B_nodal.geojson", redeB, { style: (f) => estiloRede("B", f.properties?.classe) }),
    carregar("data/trechos_dissipacao.geojson", dissipadores, { style: { color: "#a21caf", weight: 5, opacity: 0.96 }, onEachFeature: (f, l) => l.bindPopup("<strong>" + escapeHtml(f.properties?.id_diss || "Dissipador A") + "</strong><br>Trecho de dissipação/saída da Bacia A") }),
    carregar("data/trechos_dissipacao_B.geojson", dissipadores, { style: { color: "#a21caf", weight: 5, opacity: 0.96 }, onEachFeature: (_, l) => l.bindPopup("<strong>Dissipador B</strong><br>Trecho de dissipação/saída da Bacia B") }),
    carregar("data/pontos_metas_originais.geojson", pontos, { pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 4, color: "#111827", weight: 1, fillColor: "#facc15", fillOpacity: 0.95 }), onEachFeature: (f, l) => l.bindPopup("<strong>Ponto de meta original</strong><br>" + escapeHtml(f.properties?.id || f.properties?.ID || "Identificação não informada")) }),
  ];

  Promise.all(tarefas)
    .then((camadas) => {
      const limitesMapa = L.featureGroup(camadas.filter((camada) => camada.getBounds && camada.getBounds().isValid()));
      if (limitesMapa.getBounds().isValid()) map.fitBounds(limitesMapa.getBounds().pad(0.05));
      L.control.layers(
        { "Satélite Esri": satelite, "Ruas OpenStreetMap": ruas },
        {
          "Bacias A e B": limites,
          "Metas administrativas (apresentação)": formatados,
          "Polígonos originais (auditoria)": originais,
          "Rede — Bacia A": redeA,
          "Rede — Bacia B": redeB,
          "Dissipadores/saídas": dissipadores,
          "Pontos originais": pontos,
        },
        { collapsed: false },
      ).addTo(map);
      L.control.scale({ imperial: false }).addTo(map);
      setTimeout(() => map.invalidateSize(), 250);
    })
    .catch((erro) => {
      console.warn("Mapa de metas não carregado", erro);
      mensagem("Não foi possível carregar todas as camadas do mapa. Os arquivos GeoJSON e o pacote shapefile continuam disponíveis na página de dados.");
    });
})();
