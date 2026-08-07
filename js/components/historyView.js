import { loadData } from "../services/storage.service.js";
import { capitalizar } from "../utils/capitalize.js";

const HISTORIAL_KEY = "flow.historial";

export function createHistoryView({ container, onOpen }) {
  const list = container.querySelector(".historial__list");

  function resumir(reunion) {
    const objetivos = reunion.secciones.objetivos || [];
    const compromisos = reunion.secciones.compromisos || [];
    const desarrollo = reunion.secciones.desarrollo || {};

    const objetivosPendientes = objetivos.filter((o) => !o.done).length;
    const compromisosPendientes = compromisos.filter((c) => c.estado !== "completado").length;

    let puntosPendientes = 0;
    for (const id in desarrollo) {
      desarrollo[id].forEach((b) => {
        if (b.tipo === "punto" && (b.avance ?? 0) < 100) puntosPendientes += 1;
      });
    }

    return {
      totalObjetivos: objetivos.length,
      totalCompromisos: compromisos.length,
      pendientes: objetivosPendientes + compromisosPendientes + puntosPendientes,
    };
  }

  function crearTarjeta(reunion, index) {
    const resumen = resumir(reunion);

    const d = new Date(reunion.meta.fecha);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = capitalizar(d.toLocaleDateString("es-MX", { month: "long" }));
    const anio = d.getFullYear();
    const fecha = `${dia}/${mes}/${anio}`;
    const numParticipantes = (reunion.meta.participantes || []).length;

    const card = document.createElement("article");
    card.classList.add("history-card");
    card.dataset.index = index;

    const header = document.createElement("div");
    header.classList.add("history-card__header");

    const fechaEl = document.createElement("span");
    fechaEl.classList.add("history-card__date");
    fechaEl.textContent = fecha;

    const badge = document.createElement("span");
    badge.classList.add("history-card__badge");
    if (resumen.pendientes === 0) {
      badge.classList.add("history-card__badge--cerrado");
      badge.textContent = "Todo cerrado";
    } else {
      badge.classList.add("history-card__badge--pendiente");
      badge.textContent = `${resumen.pendientes} pendiente${resumen.pendientes > 1 ? "s" : ""}`;
    }

    header.append(fechaEl, badge);

    const parts = document.createElement("div");
    parts.classList.add("history-card__parts");
    parts.textContent = `${numParticipantes} participante${numParticipantes !== 1 ? "s" : ""}`;

    const stats = document.createElement("div");
    stats.classList.add("history-card__stats");
    stats.innerHTML =
      `<span><b>${resumen.totalObjetivos}</b> objetivos</span>` +
      `<span><b>${resumen.totalCompromisos}</b> compromisos</span>`;

    card.append(header, parts, stats);
    return card;
  }

  function render() {
    const historial = loadData(HISTORIAL_KEY, []);

    if (historial.length === 0) {
      list.innerHTML = `<p class="historial__empty">Aún no hay reuniones guardadas.</p>`;
      return;
    }

    const ordenado = [...historial].sort(
      (a, b) => new Date(b.meta.fecha) - new Date(a.meta.fecha)
    );

    const tarjetas = ordenado.map((reunion) => {
      const indexReal = historial.indexOf(reunion);
      return crearTarjeta(reunion, indexReal);
    });

    list.replaceChildren(...tarjetas);
  }

  list.addEventListener("click", (event) => {
    const card = event.target.closest(".history-card");
    if (!card) return;
    onOpen(Number(card.dataset.index));
  });

  return { render };
}