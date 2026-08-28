(function () {
  "use strict";

  const linhas = (geometry) => {
    if (!geometry) return [];
    if (geometry.type === "LineString") return [geometry.coordinates || []];
    if (geometry.type === "MultiLineString") return geometry.coordinates || [];
    if (geometry.type === "GeometryCollection") {
      return (geometry.geometries || []).flatMap(linhas);
    }
    return [];
  };

  const pontoLatLng = (ponto) => {
    if (!Array.isArray(ponto) || ponto.length < 2) return null;
    const lon = Number(ponto[0]);
    const lat = Number(ponto[1]);
    return Number.isFinite(lon) && Number.isFinite(lat) ? L.latLng(lat, lon) : null;
  };

  const pontoNaLinha = (map, linha, fracao) => {
    const pontos = linha.map(pontoLatLng).filter(Boolean);
    if (pontos.length < 2) return null;
    const comprimentos = [];
    let total = 0;
    for (let i = 1; i < pontos.length; i += 1) {
      const comprimento = map.distance(pontos[i - 1], pontos[i]);
      comprimentos.push(comprimento);
      total += comprimento;
    }
    if (!total) return null;
    const alvo = total * Math.min(0.78, Math.max(0.42, fracao));
    let acumulado = 0;
    for (let i = 1; i < pontos.length; i += 1) {
      const trecho = comprimentos[i - 1];
      if (acumulado + trecho >= alvo) {
        const proporcao = (alvo - acumulado) / trecho;
        const a = pontos[i - 1];
        const b = pontos[i];
        const lat = a.lat + (b.lat - a.lat) * proporcao;
        const lng = a.lng + (b.lng - a.lng) * proporcao;
        const rotacao = Math.atan2(-(b.lat - a.lat), b.lng - a.lng) * 180 / Math.PI;
        return { latlng: L.latLng(lat, lng), rotacao };
      }
      acumulado += trecho;
    }
    const a = pontos[pontos.length - 2];
    const b = pontos[pontos.length - 1];
    return {
      latlng: b,
      rotacao: Math.atan2(-(b.lat - a.lat), b.lng - a.lng) * 180 / Math.PI,
    };
  };

  window.criarSetasFluxoLeaflet = (dados, destino, map, corFeature) => {
    if (!dados || !destino || !map || typeof L === "undefined") return null;
    const setas = L.layerGroup();
    (dados.features || []).forEach((feature) => {
      const cor = corFeature(feature) || "#16224e";
      linhas(feature.geometry).forEach((linha) => {
        const posicao = pontoNaLinha(map, linha, 0.58);
        if (!posicao) return;
        const icone = L.divIcon({
          className: "fluxo-arrow-marker",
          html: `<span aria-hidden="true" style="--flow-arrow-color:${cor};--flow-arrow-rotation:${posicao.rotacao}deg"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        setas.addLayer(L.marker(posicao.latlng, {
          icon: icone,
          interactive: false,
          keyboard: false,
          zIndexOffset: 1000,
        }));
      });
    });
    destino.addLayer(setas);
    return setas;
  };
})();
