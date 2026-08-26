(function () {
  "use strict";

  const tools = document.querySelector(".quarto-navbar-tools");
  if (!tools || tools.querySelector(".language-switcher")) return;

  const urlAtual = window.location.href.split("#")[0];
  const idiomas = [
    { codigo: "pt", rotulo: "PT", nome: "Português", href: urlAtual },
    {
      codigo: "en",
      rotulo: "EN",
      nome: "English",
      href: "https://translate.google.com/translate?sl=pt&tl=en&u=" + encodeURIComponent(urlAtual),
    },
    {
      codigo: "es",
      rotulo: "ES",
      nome: "Español",
      href: "https://translate.google.com/translate?sl=pt&tl=es&u=" + encodeURIComponent(urlAtual),
    },
  ];

  const grupo = document.createElement("div");
  grupo.className = "language-switcher";
  grupo.setAttribute("role", "group");
  grupo.setAttribute("aria-label", "Idioma do relatório");

  const legenda = document.createElement("span");
  legenda.className = "language-switcher-label";
  legenda.textContent = "Idioma";
  grupo.appendChild(legenda);

  idiomas.forEach((idioma) => {
    const link = document.createElement("a");
    link.className = "language-button";
    link.href = idioma.href;
    link.textContent = idioma.rotulo;
    link.title = idioma.codigo === "pt"
      ? "Versão original em português"
      : "Abrir tradução automática em " + idioma.nome;
    link.setAttribute("aria-label", link.title);
    if (idioma.codigo !== "pt") {
      link.target = "_blank";
      link.rel = "noopener";
    }
    grupo.appendChild(link);
  });

  tools.appendChild(grupo);
})();
