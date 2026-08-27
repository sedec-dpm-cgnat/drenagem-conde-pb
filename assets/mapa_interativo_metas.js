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
  const metaLegadaParaFinal = { META_01: "META_03", META_02: "META_02", META_03: "META_03", META_04: "META_01" };
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

  const limites = L.layerGroup().addTo(map);
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
  const carregarTexto = (arquivo) => fetch(arquivo).then((resposta) => {
    if (!resposta.ok) throw new Error(arquivo + " — HTTP " + resposta.status);
    return resposta.text();
  });
  const carregar = (arquivo, destino, opcoes) => carregarJson(arquivo).then((dados) => {
    const camada = L.geoJSON(dados, opcoes).addTo(destino);
    camadasParaExtensao.push(camada);
    return camada;
  });

  const parseCsv = (texto) => {
    const registros = [];
    let registro = [];
    let campo = "";
    let entreAspas = false;
    for (let i = 0; i < texto.length; i += 1) {
      const caractere = texto[i];
      if (caractere === '"' && entreAspas && texto[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else if (caractere === '"') {
        entreAspas = !entreAspas;
      } else if (caractere === "," && !entreAspas) {
        registro.push(campo);
        campo = "";
      } else if ((caractere === "\n" || caractere === "\r") && !entreAspas) {
        if (caractere === "\r" && texto[i + 1] === "\n") i += 1;
        registro.push(campo);
        if (registro.some((valor) => valor.trim() !== "")) registros.push(registro);
        registro = [];
        campo = "";
      } else {
        campo += caractere;
      }
    }
    if (campo !== "" || registro.length) {
      registro.push(campo);
      if (registro.some((valor) => valor.trim() !== "")) registros.push(registro);
    }
    const cabecalho = (registros.shift() || []).map((valor) => valor.replace(/^\uFEFF/, "").trim());
    return registros.map((valores) => Object.fromEntries(cabecalho.map((chave, indice) => [chave, (valores[indice] || "").trim()])));
  };

  const numero = (valor) => {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "não informado";
  };

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
    "<strong>", escapeHtml(p.id_link || "Trecho"), "</strong>",
    "<br>Componente: ", escapeHtml(p.classe || "não informado"),
    "<br>Bacia: ", escapeHtml(p.bacia || (p.id_link || "").split("_")[1] || "não informada"),
    "<br>Meta(s): ", escapeHtml(metas.length ? metas.map(nomeMeta).join(", ") : "fora das metas"),
    "<br>Comprimento: ", numero(p.comp_m), " m",
    "<br>Diâmetro preliminar: ", numero(p.diam_m), " m",
    "<br>Declividade: ", numero(p.decl_pct), " %",
    "<br>Nós: ", escapeHtml(p.node_in || "não informado"), " → ", escapeHtml(p.node_out || "não informado"),
  ].join("");

  const estiloBacia = (cor) => ({ color: cor, weight: 2, fillColor: cor, fillOpacity: 0.06, dashArray: "6 5" });
  const estiloForaMeta = { color: "#9aa3af", weight: 2.1, opacity: 0.82, dashArray: "8 7" };
  const estiloMeta = (codigo, classe) => {
    const estilo = { color: cores[codigo], weight: classe === "TRONCO" ? 4.8 : 3.2, opacity: 0.98 };
    if (classe === "COLETOR") estilo.dashArray = "8 6";
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
    carregar("data/bacia_A.geojson", limites, { style: estiloBacia("#c35416"), onEachFeature: (_, l) => l.bindPopup("<strong>Bacia A</strong><br>Unidade de drenagem de trabalho") }),
    carregar("data/bacia_B.geojson", limites, { style: estiloBacia("#087f7b"), onEachFeature: (_, l) => l.bindPopup("<strong>Bacia B</strong><br>Unidade de drenagem de trabalho") }),
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
      pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 4, color: "#111827", weight: 1, fillColor: "#facc15", fillOpacity: 0.95 }),
      onEachFeature: (f, l) => l.bindPopup("<strong>Ponto de meta original</strong><br>" + escapeHtml(f.properties?.id || f.properties?.ID || "Identificação não informada")),
    }),
    carregarJson("data/rede_linhas_A_nodal.geojson"),
    carregarJson("data/rede_linhas_B_nodal.geojson"),
    carregarTexto("data/metas_plano_trabalho/trechos_metas_administrativas_parametros.csv"),
  ];

  Promise.all(tarefas)
    .then((resultados) => {
      const redeA = resultados[7];
      const redeB = resultados[8];
      const linhasMetas = parseCsv(resultados[9]);
      const linksPorMeta = Object.fromEntries(Object.keys(cores).map((codigo) => [codigo, new Set()]));
      const metasPorLink = new Map();

      linhasMetas.forEach((linha) => {
        const idLink = linha.ID_LINK;
        const metaFinal = metaLegadaParaFinal[linha.META_ID] || linha.META_ADMIN;
        if (!idLink || !linksPorMeta[metaFinal]) return;
        linksPorMeta[metaFinal].add(idLink);
        if (!metasPorLink.has(idLink)) metasPorLink.set(idLink, new Set());
        metasPorLink.get(idLink).add(metaFinal);
      });

      const redeCompleta = [
        ...(redeA.features || []).map((feature) => ({ ...feature, properties: { ...(feature.properties || {}), bacia: "A" } })),
        ...(redeB.features || []).map((feature) => ({ ...feature, properties: { ...(feature.properties || {}), bacia: "B" } })),
      ];
      const criarCamadaRede = (features, destino, estilo) => {
        const camada = L.geoJSON({ type: "FeatureCollection", features }, {
          style: estilo,
          onEachFeature: (feature, layer) => layer.bindPopup(popupRede(feature.properties || {}, Array.from(metasPorLink.get(feature.properties?.id_link) || []))),
        }).addTo(destino);
        camadasParaExtensao.push(camada);
        return camada;
      };

      criarCamadaRede(redeCompleta.filter((feature) => !(metasPorLink.get(feature.properties?.id_link)?.size)), redeRestante, estiloForaMeta);
      Object.keys(cores).forEach((codigo) => {
        criarCamadaRede(
          redeCompleta.filter((feature) => linksPorMeta[codigo].has(feature.properties?.id_link)),
          metaCamadas[codigo],
          (feature) => estiloMeta(codigo, feature.properties?.classe),
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
          "Bacias A e B": limites,
          "Rede fora das metas (tracejada)": redeRestante,
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
