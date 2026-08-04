import { setReunionActivaId } from "./session.js";
import { saveData } from "./storage.service.js";
import { showView } from "./viewManager.js";

export function initMeetingLifecycle({ onStart }) {
  const btnIniciar = document.querySelector("#btn-iniciar");
  const dialog = document.querySelector(".start-dialog");
  const form = document.querySelector(".start-dialog__form");
  const cancelBtn = dialog.querySelector(".start-dialog__cancel");
  const dateSpan = dialog.querySelector(".start-dialog__date");

  const chipsContainer = document.querySelector("#chips-participantes");
  const participanteInput = document.querySelector("#input-participante");
  const duracionInput = document.querySelector("#input-duracion");

  let participantes = [];

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
  }

  function addParticipante(nombre) {
    const limpio = nombre.trim();
    if (limpio === "") return;
    participantes.push(limpio);
    renderChips();
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

  function startMeeting() {
    const id = crypto.randomUUID();
    const reunion = {
      id,
      fecha: new Date().toISOString(),
      participantes,
      duracion: Number(duracionInput.value),
      estado: "en-curso",
    };

    setReunionActivaId(id);
    saveData(`flow.reunion.${id}.meta`, reunion);

    closeDialog();
    showView("reunion");
    onStart(reunion);
  }

  btnIniciar.addEventListener("click", openDialog);
  cancelBtn.addEventListener("click", closeDialog);

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