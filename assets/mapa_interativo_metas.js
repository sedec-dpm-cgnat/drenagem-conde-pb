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
  const map = L.map(container, {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    boxZoom: true,
    keyboard: true,
    preferCanvas: true,
  });

  const satelite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "&copy; Esri, Maxar, Earthstar Geographics e colaboradores" },
  ).addTo(map);
  const ruas = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" },
  );

  const limitesA = L.layerGroup().addTo(map);
  const limitesB = L.layerGroup().addTo(map);
  const originais = L.layerGroup();
  const formatados = L.layerGroup();
  const redeRestante = L.layerGroup().addTo(map);
  const metaCamadas = Object.fromEntries(Object.keys(cores).map((codigo) => [codigo, L.layerGroup().addTo(map)]));
  const dissipadores = L.layerGroup().addTo(map);
  const pontos = L.layerGroup();
  const camadasParaExtensao = [];

  const carregarJson = (arquivo) => fetch(arquivo).then((resposta) => {
    if (!resposta.ok) throw new Error(arquivo + " — HTTP " + resposta.status);
    return resposta.json();
  });
  const carregar = (arquivo, destino, opcoes) => carregarJson(arquivo).then((dados) => {
    const camada = L.geoJSON(dados, opcoes).addTo(destino);
    camadasParaExtensao.push(camada);
    return camada;
  });

  const numero = (valor) => {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "não informado";
  };

  const nomePontoOriginal = (p) => String(
    p.nome_exibicao || p.nome_original || p.nome || p.id || p.ID || "Identificação não informada",
  ).replace(/\s*-\s*foto\??\s*$/i, "").trim();

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

  const popupRede = (p, metas) => [
    "<strong>", escapeHtml(p.ID_LINK_SEG || p.id_link || "Trecho"), "</strong>",
    p.ID_LINK_SEG ? ["<br>Link original: ", escapeHtml(p.id_link || "não informado")].join("") : "",
    "<br>Componente: ", escapeHtml(p.classe || "não informado"),
    "<br>Bacia: ", escapeHtml(p.bacia || (p.id_link || "").split("_")[1] || "não informada"),
    "<br>Meta(s): ", escapeHtml(metas.length ? metas.map(nomeMeta).join(", ") : "fora das metas"),
    "<br>Comprimento do segmento: ", numero(p.COMP_REC_M ?? p.comp_m), " m",
    p.COMP_REC_M ? ["<br>Percentual do link original: ", numero(p.PERC_LINK_REC), " %"].join("") : "",
    "<br>Diâmetro preliminar: ", numero(p.diam_m), " m",
    "<br>Declividade: ", numero(p.decl_pct), " %",
    "<br>Nós: ", escapeHtml(p.node_in || "não informado"), " → ", escapeHtml(p.node_out || "não informado"),
  ].join("");

  const estiloBacia = (cor) => ({ color: cor, weight: 2, fillColor: cor, fillOpacity: 0.06, dashArray: "6 5" });
  const estiloForaMeta = { color: "#ffffff", weight: 2.4, opacity: 0.96, dashArray: "8 7" };
  const estiloMeta = (codigo, classe) => {
    const classeNormalizada = String(classe || "").toUpperCase();
    if (classeNormalizada === "DISSIPADOR") return { color: "#a21caf", weight: 5, opacity: 0.98 };
    const estilo = { color: cores[codigo], weight: classeNormalizada === "TRONCO" ? 4.8 : 3.2, opacity: 0.98 };
    if (classeNormalizada === "COLETOR") estilo.dashArray = "8 6";
    return estilo;
  };

  const normalizarDissipadoresB = (dados) => ({
    ...dados,
    features: (dados.features || []).map((feature, indice) => {
      const geometria = feature.geometry || {};
      const coordenadas = (geometria.coordinates || []).map((ponto) => {
        if (Array.isArray(ponto)) return ponto.map(Number);
        if (typeof ponto === "string") return ponto.trim().split(/[\s,]+/).slice(0, 2).map(Number);
        return ponto;
      });
      return {
        ...feature,
        properties: { ...(feature.properties || {}), id_diss: "DISS_B_" + String(indice + 1).padStart(2, "0") },
        geometry: { ...geometria, coordinates: coordenadas },
      };
    }),
  });

  const tarefas = [
    carregar("data/bacia_A.geojson", limitesA, { style: estiloBacia("#c35416"), onEachFeature: (_, l) => l.bindPopup("<strong>Bacia A</strong><br>Unidade de drenagem de trabalho") }),
    carregar("data/bacia_B.geojson", limitesB, { style: estiloBacia("#087f7b"), onEachFeature: (_, l) => l.bindPopup("<strong>Bacia B</strong><br>Unidade de drenagem de trabalho") }),
    carregar("data/metas_plano_trabalho/metas_selecionadas_original.geojson", originais, {
      style: (f) => ({ color: cores[f.properties?.META_FINAL] || "#4b5563", weight: 2, fillColor: cores[f.properties?.META_FINAL] || "#4b5563", fillOpacity: 0.08, dashArray: "5 5" }),
      onEachFeature: (f, l) => l.bindPopup(popupOriginal(f.properties || {})),
    }),
    carregar("data/metas_plano_trabalho/metas_administrativas_display.geojson", formatados, {
      style: (f) => ({ color: cores[f.properties?.META_ID] || "#4b5563", weight: 2.5, fillColor: cores[f.properties?.META_ID] || "#4b5563", fillOpacity: 0.12 }),
      onEachFeature: (f, l) => {
        l.bindPopup(popupMeta(f.properties || {}));
        l.bindTooltip(nomeMeta(f.properties?.META_ID), { sticky: true });
      },
    }),
    carregar("data/trechos_dissipacao.geojson", dissipadores, {
      style: { color: "#a21caf", weight: 5, opacity: 0.96 },
      onEachFeature: (f, l) => l.bindPopup("<strong>" + escapeHtml(f.properties?.id_diss || "Dissipador A") + "</strong><br>Trecho de dissipação/saída da Bacia A"),
    }),
    carregarJson("data/trechos_dissipacao_B.geojson").then((dados) => {
      const camada = L.geoJSON(normalizarDissipadoresB(dados), {
        style: { color: "#a21caf", weight: 5, opacity: 0.96 },
        onEachFeature: (f, l) => l.bindPopup("<strong>" + escapeHtml(f.properties?.id_diss || "Dissipador B") + "</strong><br>Trecho de dissipação/saída da Bacia B"),
      }).addTo(dissipadores);
      camadasParaExtensao.push(camada);
      return camada;
    }),
    carregar("data/pontos_metas_originais.geojson", pontos, {
      pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 5, color: "#111827", weight: 1.2, fillColor: "#facc15", fillOpacity: 0.95 }),
      onEachFeature: (f, l) => {
        const identificacao = nomePontoOriginal(f.properties || {});
        l.bindTooltip(escapeHtml(identificacao), {
          permanent: true,
          direction: "right",
          offset: [7, 0],
          className: "metas-ponto-label",
        });
        l.bindPopup("<strong>Ponto original: " + escapeHtml(identificacao) + "</strong><br>Fonte: Conde_Pontos_metas.kmz<br><em>A identificação foi normalizada para a leitura cartográfica.</em>");
      },
    }),
    carregarJson("data/metas_plano_trabalho/trechos_metas_recortados.geojson"),
    carregarJson("data/metas_plano_trabalho/rede_fora_metas_recortada.geojson"),
  ];

  Promise.all(tarefas)
    .then((resultados) => {
      const segmentosMetas = resultados[7];
      const segmentosFora = resultados[8];
      const criarCamadaRede = (features, destino, estilo, metaCodigo = null) => {
        const featuresComBacia = features.map((feature) => ({
          ...feature,
          properties: {
            ...(feature.properties || {}),
            bacia: feature.properties?.bacia || (feature.properties?.id_link || "").split("_")[1] || "",
          },
        }));
        const camada = L.geoJSON({ type: "FeatureCollection", features: featuresComBacia }, {
          style: estilo,
          onEachFeature: (feature, layer) => layer.bindPopup(popupRede(feature.properties || {}, metaCodigo ? [metaCodigo] : [])),
        }).addTo(destino);
        camadasParaExtensao.push(camada);
        return camada;
      };

      criarCamadaRede(segmentosFora.features || [], redeRestante, estiloForaMeta);
      Object.keys(cores).forEach((codigo) => {
        criarCamadaRede(
          (segmentosMetas.features || []).filter((feature) => feature.properties?.META_ID === codigo),
          metaCamadas[codigo],
          (feature) => estiloMeta(codigo, feature.properties?.classe),
          codigo,
        );
      });

      const limitesValidos = [];
      camadasParaExtensao.forEach((camada) => {
        try {
          const limitesCamada = camada.getBounds();
          if (limitesCamada.isValid()) limitesValidos.push(camada);
        } catch (erro) {
          // Uma camada sem geometria válida não deve impedir a abertura do painel.
        }
      });
      const limitesMapa = L.featureGroup(limitesValidos);
      if (limitesMapa.getBounds().isValid()) map.fitBounds(limitesMapa.getBounds().pad(0.05));

      L.control.layers(
        { "Satélite Esri": satelite, "Ruas OpenStreetMap": ruas },
        {
          "Bacia A": limitesA,
          "Bacia B": limitesB,
          "Rede de Drenagem Concebida (tracejada)": redeRestante,
          "Meta 1 — Bacia A": metaCamadas.META_01,
          "Meta 2 — Bacia B": metaCamadas.META_02,
          "Meta 3 — Bacia B": metaCamadas.META_03,
          "Envelopes esquemáticos das metas": formatados,
          "Polígonos originais (auditoria)": originais,
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
