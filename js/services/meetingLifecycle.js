import { setReunionActivaId } from "./session.js";
import { saveData } from "./storage.service.js";
import { showView } from "./viewManager.js";
import { terminarReunion } from "./meetingArchive.js";
import { confirmDialog } from "./confirmDialog.js";
import { heredarPendientes } from "./inheritance.js";

export function initMeetingLifecycle({ onStart, onPause, onResume, onEnd }) {
  const btnIniciar = document.querySelector("#btn-iniciar");
  const dialog = document.querySelector(".start-dialog");
  const form = document.querySelector(".start-dialog__form");
  const cancelBtn = dialog.querySelector(".start-dialog__cancel");
  const dateSpan = dialog.querySelector(".start-dialog__date");
  const btnPausar = document.querySelector("#btn-pausar");
  const btnTerminar = document.querySelector("#btn-terminar");
  const overlay = document.querySelector("#pause-overlay");
  const chipsContainer = document.querySelector("#chips-participantes");
  const participanteInput = document.querySelector("#input-participante");
  const duracionInput = document.querySelector("#input-duracion");

  let participantes = [];
  let pausada = false;

  function renderChips() {
    chipsContainer.replaceChildren(
      ...participantes.map((nombre, i) => {
        const chip = document.createElement("span");
        chip.classList.add("chip");
        chip.textContent = nombre;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.classList.add("chip__remove");
        remove.textContent = "✕";
        remove.dataset.index = i;
        remove.setAttribute("aria-label", `Quitar a ${nombre}`);

        chip.appendChild(remove);
        return chip;
      })
    );
    actualizarBotonIniciar();
  }

  function addParticipante(nombre) {
    const limpio = nombre.trim();
    if (limpio === "") return;
    participantes.push(limpio);
    renderChips();
  }

    function actualizarBotonIniciar() {
  const confirmBtn = dialog.querySelector(".start-dialog__confirm");
  confirmBtn.disabled = participantes.length < 2;
}

  function openDialog() {
    participantes = [];
    renderChips();
    participanteInput.value = "";
    duracionInput.value = "60";
    dateSpan.textContent = new Date().toLocaleDateString("es-MX", {
      day: "2-digit", month: "long", year: "numeric",
    });
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
  }
  function setBotonesReunionActiva(activa){
    btnIniciar.disabled = activa;
    btnPausar.disabled = !activa;
    btnTerminar.disabled = !activa;
  }

  function startMeeting() {
    if(participantes.length<2){
      return
    }
    const id = crypto.randomUUID();
    const reunion = {
      id,
      fecha: new Date().toISOString(),
      participantes,
      duracion: Number(duracionInput.value),
      estado: "en-curso",
    };

    pausada= false;
    btnPausar.textContent = "Pausar"
    setReunionActivaId(id);
    saveData(`flow.reunion.${id}.meta`, reunion);

    heredarPendientes(id)

    closeDialog();
    showView("reunion");
    setBotonesReunionActiva(true);
    onStart(reunion);
  }

  async function terminar() {
  const confirmado = await confirmDialog(
    "¿Seguro que quieres terminar la reunión? Se guardará en el historial y no podrás editarla."
  );

  if (!confirmado) return;

  terminarReunion();

  timer.detener?.();   // por si acaso
  overlay.classList.remove("pause-overlay--visible");
  pausada = false;
  setBotonesReunionActiva(false);
  btnPausar.textContent = "Pausar";

  showView("historial");
  onEnd();
}




  function actualizarBadgeEstado(texto, clase){
    const estadoEl = document.querySelector('[data-campo="estado"]');
    estadoEl.innerHTML = "";
    const badge = document.createElement("span");
    badge.classList.add("status-badge", clase);
  badge.textContent = texto;
  estadoEl.appendChild(badge);
}

function pausar() {
  pausada = true;
  overlay.classList.add("pause-overlay--visible");
  btnPausar.textContent = "Reanudar";
  actualizarBadgeEstado("● Pausada", "status-badge--pausada");
  onPause();
}

function reanudar() {
  pausada = false;
  overlay.classList.remove("pause-overlay--visible");
  btnPausar.textContent = "Pausar";
  actualizarBadgeEstado("● En curso", "status-badge--en-curso");
  onResume();
}

function togglePausa() {
  if (pausada) reanudar();
  else pausar();
}
  

  btnIniciar.addEventListener("click", openDialog);
  cancelBtn.addEventListener("click", closeDialog);
  btnPausar.addEventListener("click", togglePausa);
  btnTerminar.addEventListener("click", terminar);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  participanteInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addParticipante(participanteInput.value);
      participanteInput.value = "";
    }
  });

  chipsContainer.addEventListener("click", (event) => {
    if (!event.target.matches(".chip__remove")) return;
    participantes.splice(Number(event.target.dataset.index), 1);
    renderChips();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    startMeeting();
  });
}