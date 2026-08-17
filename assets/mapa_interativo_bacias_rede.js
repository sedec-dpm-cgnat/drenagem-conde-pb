(function () {
  "use strict";

  const container = document.getElementById("mapa-interativo-bacias-rede");
  if (!container) return;

  const mensagem = (texto) => {
    container.innerHTML = '<div class="leaflet-fallback">' + texto + "</div>";
  };

  if (typeof L === "undefined") {
    mensagem("O mapa interativo depende da biblioteca Leaflet. A figura estática continua disponível abaixo.");
    return;
  }

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));

  const map = L.map(container, {
    scrollWheelZoom: false,
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

  const redeA = L.layerGroup().addTo(map);
  const redeB = L.layerGroup().addTo(map);
  const bacias = L.layerGroup().addTo(map);
  const nos = L.layerGroup();
  const dissipadores = L.layerGroup().addTo(map);

  const styleBacia = (cor) => ({
    color: cor,
    weight: 2,
    fillColor: cor,
    fillOpacity: 0.08,
    dashArray: "6 5",
  });

  const styleRede = (bacia, classe) => {
    const cor = bacia === "A" ? "#c35416" : "#087f7b";
    if (classe === "DISSIPADOR") {
      return { color: "#a21caf", weight: 5, opacity: 0.96 };
    }
    if (classe === "COLETOR") {
      return { color: cor, weight: 2.2, opacity: 0.95, dashArray: "8 6" };
    }
    return { color: cor, weight: 3.4, opacity: 0.98 };
  };

  const popupRede = (p) => [
    "<strong>", escapeHtml(p.id_link || "Link"), "</strong>",
    "<br>Classe: ", escapeHtml(p.classe),
    "<br>Montante: ", escapeHtml(p.node_in),
    "<br>Jusante: ", escapeHtml(p.node_out),
    "<br>Comprimento: ", p.comp_m ? Number(p.comp_m).toFixed(1) + " m" : "não informado",
    "<br>Diâmetro preliminar: ", p.diam_m ? Number(p.diam_m).toFixed(2) + " m" : "não informado",
    "<br>Declividade: ", p.decl_pct ? Number(p.decl_pct).toFixed(2) + " %" : "não informado",
  ].join("");

  const popupNo = (p) => [
    "<strong>", escapeHtml(p.id_node || "Nó"), "</strong>",
    "<br>Tipo: ", escapeHtml(p.tipo),
    "<br>Cota: ", p.cota_m ? Number(p.cota_m).toFixed(2) + " m" : "não informado",
    "<br>Entradas/saídas: ", escapeHtml(p.deg_in), " / ", escapeHtml(p.deg_out),
  ].join("");

  const carregarGeoJson = (arquivo, destino, opcoes) => fetch(arquivo)
    .then((resposta) => {
      if (!resposta.ok) throw new Error(arquivo + " — HTTP " + resposta.status);
      return resposta.json();
    })
    .then((dados) => {
      const camada = L.geoJSON(dados, opcoes);
      camada.addTo(destino);
      return camada;
    });

  const tarefas = [
    carregarGeoJson("data/bacia_A.geojson", bacias, { style: styleBacia("#c35416"), onEachFeature: (f, l) => l.bindPopup("<strong>Bacia A</strong><br>Unidade de drenagem de trabalho") }),
    carregarGeoJson("data/bacia_B.geojson", bacias, { style: styleBacia("#087f7b"), onEachFeature: (f, l) => l.bindPopup("<strong>Bacia B</strong><br>Unidade de drenagem de trabalho") }),
    carregarGeoJson("data/rede_linhas_A_nodal.geojson", redeA, {
      style: (f) => styleRede("A", f.properties?.classe),
      onEachFeature: (f, l) => l.bindPopup(popupRede(f.properties || {})),
    }),
    carregarGeoJson("data/rede_linhas_B_nodal.geojson", redeB, {
      style: (f) => styleRede("B", f.properties?.classe),
      onEachFeature: (f, l) => l.bindPopup(popupRede(f.properties || {})),
    }),
    carregarGeoJson("data/rede_nos_A.geojson", nos, {
      pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 3, color: "#16224e", weight: 1, fillColor: "#ffffff", fillOpacity: 0.9 }),
      onEachFeature: (f, l) => l.bindPopup(popupNo(f.properties || {})),
    }),
    carregarGeoJson("data/rede_nos_B.geojson", nos, {
      pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 3, color: "#16224e", weight: 1, fillColor: "#ffffff", fillOpacity: 0.9 }),
      onEachFeature: (f, l) => l.bindPopup(popupNo(f.properties || {})),
    }),
    carregarGeoJson("data/trechos_dissipacao.geojson", dissipadores, {
      style: { color: "#a21caf", weight: 5, opacity: 0.96 },
      onEachFeature: (f, l) => l.bindPopup("<strong>" + escapeHtml(f.properties?.id_diss || "Dissipador A") + "</strong><br>Trecho de dissipação/saída da Bacia A"),
    }),
    carregarGeoJson("data/trechos_dissipacao_B.geojson", dissipadores, {
      style: { color: "#a21caf", weight: 5, opacity: 0.96 },
      onEachFeature: (f, l) => l.bindPopup("<strong>Dissipador B</strong><br>Trecho de dissipação/saída da Bacia B"),
    }),
  ];

  Promise.all(tarefas)
    .then((camadas) => {
      const limite = L.featureGroup(camadas.filter((camada) => camada.getBounds && camada.getBounds().isValid()));
      if (limite.getBounds().isValid()) map.fitBounds(limite.getBounds().pad(0.05));
      L.control.layers(
        { "Satélite Esri": satelite, "Ruas OpenStreetMap": ruas },
        {
          "Bacias A e B": bacias,
          "Rede — Bacia A": redeA,
          "Rede — Bacia B": redeB,
          "Dissipadores/saídas": dissipadores,
          "Nós": nos,
        },
        { collapsed: false },
      ).addTo(map);
      L.control.scale({ imperial: false }).addTo(map);
      setTimeout(() => map.invalidateSize(), 250);
    })
    .catch((erro) => {
      console.warn("Mapa interativo não carregado", erro);
      mensagem("Não foi possível carregar todas as camadas do mapa interativo. A figura estática e os arquivos GeoJSON continuam disponíveis na página de dados.");
    });
})();
