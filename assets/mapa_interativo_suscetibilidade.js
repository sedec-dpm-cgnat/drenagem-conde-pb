(function () {
  "use strict";

  const container = document.getElementById("mapa-interativo-suscetibilidade");
  if (!container) return;

  const mensagem = (texto) => {
    container.innerHTML = '<div class="leaflet-fallback">' + texto + "</div>";
  };

  if (typeof L === "undefined") {
    mensagem("O mapa interativo depende da biblioteca Leaflet. A figura estática e as camadas editáveis continuam disponíveis na página de dados.");
    return;
  }

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));

  const normalizarRotulo = (value) => String(value ?? "")
    .replace(/\s*-\s*foto\?\s*$/i, "")
    .trim();

  const map = L.map(container, {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    preferCanvas: true,
  });

  const satelite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "&copy; Esri, Maxar, Earthstar Geographics e colaboradores",
    },
  );
  const ruas = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    },
  );
  satelite.addTo(map);

  const suscAlta = L.layerGroup().addTo(map);
  const suscMedia = L.layerGroup().addTo(map);
  const baciaA = L.layerGroup().addTo(map);
  const baciaB = L.layerGroup().addTo(map);
  const pontosMetas = L.layerGroup().addTo(map);
  const pontosErosao = L.layerGroup();

  const carregarJson = (arquivo) => fetch(arquivo)
    .then((resposta) => {
      if (!resposta.ok) throw new Error(arquivo + " — HTTP " + resposta.status);
      return resposta.json();
    });

  const popupArea = (p) => [
    "<strong>", escapeHtml(p.nome_original || "Área de suscetibilidade"), "</strong>",
    "<br>Classe: ", escapeHtml(p.classe_original || "não informada"),
    "<br>Interpretação: propensão à concentração do escoamento e à erosão.",
    "<br>Fonte: ", escapeHtml(p.fonte_original || "não informada"),
  ].join("");

  const popupMeta = (p) => {
    const nome = normalizarRotulo(p.nome_original || p.nome || "Ponto original");
    return [
      "<strong>Ponto original: ", escapeHtml(nome), "</strong>",
      "<br>Fonte: Conde_Pontos_metas.kmz",
      "<br>Identificação cartográfica do diagnóstico original.",
    ].join("");
  };

  const popupErosao = (p) => [
    "<strong>", escapeHtml(p.nome_original || "Ponto de erosão"), "</strong>",
    "<br>Registro de erosão com fotografia",
    p.descricao ? "<br>" + escapeHtml(p.descricao) : "",
  ].join("");

  const estiloArea = (classe) => {
    const alta = /alta/i.test(classe || "");
    return {
      color: alta ? "#a3263a" : "#a36f00",
      weight: 1.4,
      fillColor: alta ? "#d1495b" : "#e3a21a",
      fillOpacity: alta ? 0.34 : 0.28,
    };
  };

  const estiloBacia = (cor) => ({
    color: cor,
    weight: 2.4,
    fillColor: cor,
    fillOpacity: 0.06,
    dashArray: "7 5",
  });

  Promise.all([
    carregarJson("data/areas_erosao_originais.geojson"),
    carregarJson("data/bacia_A.geojson"),
    carregarJson("data/bacia_B.geojson"),
    carregarJson("data/pontos_metas_originais.geojson"),
    carregarJson("data/pontos_erosao_fotos_originais.geojson"),
  ])
    .then(([areas, dadosA, dadosB, metas, erosao]) => {
      const alta = {
        type: "FeatureCollection",
        features: areas.features.filter((f) => /alta/i.test(f.properties?.classe_original || "")),
      };
      const media = {
        type: "FeatureCollection",
        features: areas.features.filter((f) => /m[eé]dia/i.test(f.properties?.classe_original || "")),
      };

      const camadaAlta = L.geoJSON(alta, {
        style: (f) => estiloArea(f.properties?.classe_original),
        onEachFeature: (f, l) => l.bindPopup(popupArea(f.properties || {})),
      }).addTo(suscAlta);
      const camadaMedia = L.geoJSON(media, {
        style: (f) => estiloArea(f.properties?.classe_original),
        onEachFeature: (f, l) => l.bindPopup(popupArea(f.properties || {})),
      }).addTo(suscMedia);

      const camadaA = L.geoJSON(dadosA, {
        style: estiloBacia("#c35416"),
        onEachFeature: (f, l) => l.bindPopup("<strong>Bacia A</strong><br>Unidade de drenagem de trabalho"),
      }).addTo(baciaA);
      const camadaB = L.geoJSON(dadosB, {
        style: estiloBacia("#087f7b"),
        onEachFeature: (f, l) => l.bindPopup("<strong>Bacia B</strong><br>Unidade de drenagem de trabalho"),
      }).addTo(baciaB);

      const camadaMetas = L.geoJSON(metas, {
        pointToLayer: (f, latlng) => L.circleMarker(latlng, {
          radius: 5,
          color: "#16224e",
          weight: 1.3,
          fillColor: "#ffffff",
          fillOpacity: 0.98,
        }),
        onEachFeature: (f, l) => {
          const nome = normalizarRotulo(f.properties?.nome_original || "Ponto original");
          l.bindTooltip(escapeHtml(nome), {
            permanent: true,
            direction: "right",
            className: "metas-ponto-label",
            offset: [7, 0],
          });
          l.bindPopup(popupMeta(f.properties || {}));
        },
      }).addTo(pontosMetas);

      const camadaErosao = L.geoJSON(erosao, {
        pointToLayer: (f, latlng) => L.circleMarker(latlng, {
          radius: 5,
          color: "#7f1d1d",
          weight: 1.3,
          fillColor: "#ef4444",
          fillOpacity: 0.9,
        }),
        onEachFeature: (f, l) => l.bindPopup(popupErosao(f.properties || {})),
      }).addTo(pontosErosao);

      const extensao = L.featureGroup([camadaAlta, camadaMedia, camadaA, camadaB]);
      if (extensao.getBounds().isValid()) map.fitBounds(extensao.getBounds().pad(0.05));

      L.control.layers(
        { "Satélite Esri": satelite, "Ruas OpenStreetMap": ruas },
        {
          "Suscetibilidade alta": suscAlta,
          "Suscetibilidade média": suscMedia,
          "Bacia A": baciaA,
          "Bacia B": baciaB,
          "Pontos originais das metas": pontosMetas,
          "Pontos de erosão com fotos": pontosErosao,
        },
        { collapsed: false },
      ).addTo(map);
      L.control.scale({ imperial: false }).addTo(map);
      setTimeout(() => map.invalidateSize(), 250);
    })
    .catch((erro) => {
      console.warn("Mapa de suscetibilidade não carregado", erro);
      mensagem("Não foi possível carregar todas as camadas do mapa interativo. A figura estática e os arquivos GeoJSON continuam disponíveis na página de dados.");
    });
})();
