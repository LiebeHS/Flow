import { loadData } from "../services/storage.service.js";
import { showView } from "../services/viewManager.js";
import { capitalizar } from "../utils/capitalize.js";

const HISTORIAL_KEY = "flow.historial";

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  "en-progreso": "En progreso",
  completado: "Completado",
};

export function createArchiveView() {
  const content = document.querySelector("#archive-content");
  const backBtn = document.querySelector("#archive-back");

  function titulo(texto) {
    const h = document.createElement("h2");
    h.classList.add("archive__section-title");
    h.textContent = texto;
    return h;
  }

  function parrafo(texto) {
    const p = document.createElement("p");
    p.classList.add("archive__text");
    p.textContent = texto || "—";
    return p;
  }

  function listaSimple(items, formato) {
    const ul = document.createElement("ul");
    ul.classList.add("archive__list");
    if (items.length === 0) {
      ul.appendChild(parrafo("Sin registros."));
      return ul;
    }
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = formato(item);
      ul.appendChild(li);
    });
    return ul;
  }

  function pintarDesarrollo(desarrollo, objetivos) {
    const cont = document.createElement("div");
    for (const objetivoId in desarrollo) {
      const bloques = desarrollo[objetivoId];
      const obj = objetivos.find((o) => o.id === objetivoId);

      if (obj) cont.appendChild(titulo(obj.texto));

      bloques.forEach((b) => {
        if (b.tipo === "subtitulo") {
          const s = document.createElement("h4");
          s.textContent = b.texto;
          cont.appendChild(s);
        } else if (b.tipo === "punto") {
          const p = document.createElement("p");
          p.textContent = `• ${b.texto} (${b.avance ?? 0}%)`;
          cont.appendChild(p);
        } else {
          cont.appendChild(parrafo(b.texto));
        }
      });
    }
    return cont;
  }

  function render(index) {
    const historial = loadData(HISTORIAL_KEY, []);
    const reunion = historial[index];
    console.log("ABRIENDO REUNION: ", index, reunion);
    if (!reunion) return;

    content.replaceChildren();
    const s = reunion.secciones;
    console.log("Secciones:", s);

    content.appendChild(titulo("Objetivos"));
    content.appendChild(listaSimple(s.objetivos || [], (o) =>
      `${o.done ? "✓" : "○"} ${o.texto}`
    ));

    content.appendChild(titulo("Asuntos generales"));
    content.appendChild(listaSimple(s.asuntos || [], (a) =>
      `${a.done ? "✓" : "○"} ${a.texto}`
    ));

    content.appendChild(titulo("Desarrollo"));
    content.appendChild(pintarDesarrollo(s.desarrollo || {}, s.objetivos || []));

    content.appendChild(titulo("Compromisos"));
    content.appendChild(listaSimple(s.compromisos || [], (c) =>
      `${c.colaboradores?.join(", ") || ""} — ${c.descripcion} [${ESTADO_LABEL[c.estado] || c.estado}]`
    ));

    content.appendChild(titulo("Otros asuntos"));
    content.appendChild(parrafo(s.otros));

    content.appendChild(titulo("Competitividad"));
    content.appendChild(parrafo(s.competitividad));

    content.appendChild(titulo("Acuerdos"));
    content.appendChild(parrafo(s.acuerdos));

    content.appendChild(titulo("Enlaces"));
    content.appendChild(listaSimple(s.enlaces || [], (e) => `${e.titulo}: ${e.url}`));

    content.appendChild(titulo("Reflexión grupal"));
    content.appendChild(parrafo(s.reflexion));

    showView("archivo");
  }

  backBtn.addEventListener("click", () => showView("historial"));

  return { render };
}