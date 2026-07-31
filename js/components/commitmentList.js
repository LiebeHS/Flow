import { loadData, saveData } from "../services/storage.service.js";

const ESTADO_LABEL = {
  "pendiente": "Pendiente",
  "en-progreso": "En progreso",
  "completado": "Completado",
};

const PRIORIDAD_LABEL = {
  "alta": "Prioridad alta",
  "media": "Prioridad media",
  "baja": "Prioridad baja",
};

export function createCommitmentList({ container, storageKey }) {
  const list = container.querySelector(".commitment-list__list");
  const addBtn = container.querySelector(".commitment-list__add");
  const dialog = container.querySelector(".commitment-list__dialog");
  const cancelBtn = container.querySelector(".commitment-list__cancel");
  const form = container.querySelector(".commitment-list__form");
  const formTitle = container.querySelector(".commitment-list__form-title");
  const saveBtn = container.querySelector(".commitment-list__save");

  let items = loadData(storageKey);
  let editingId = null; //* NULL significa "modo alta" y cualquier id significa "modo edición"

  function createCard(data) {
    const card = document.createElement("li");
    card.classList.add("commitment-card");
    card.classList.add(`commitment-card--${data.prioridad}`);
    card.dataset.id = data.id;
    card.title = "Doble clic para editar";

    const header = document.createElement("div");
    header.classList.add("commitment-card__header");

    const title = document.createElement("span");
    title.classList.add("commitment-card__title");
    title.textContent = data.descripcion;

    const actions = document.createElement("div");
    actions.classList.add("commitment-card__actions");

    const badge = document.createElement("span");
    badge.classList.add("commitment-card__badge");
    badge.classList.add(`commitment-card__badge--${data.estado}`);
    badge.textContent = ESTADO_LABEL[data.estado];

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.classList.add("commitment-card__delete");
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", "Eliminar compromiso");

    actions.append(badge, deleteBtn);
    header.append(title, actions);

    const meta = document.createElement("div");
    meta.classList.add("commitment-card__meta");
    meta.textContent = `${data.colaboradores.join(", ")} · ${data.fechaInicio || "?"} → ${data.fechaLimite || "?"} · ${ESTADO_LABEL[data.estado]} · ${PRIORIDAD_LABEL[data.prioridad]}`;

    card.append(header, meta);
    return card;
  }

  function render() {
    const cards = items.map(createCard);
    list.replaceChildren(...cards);
    saveData(storageKey, items);
  }

  function addCommitment(data) {
    items.push({ id: crypto.randomUUID(), ...data });
    render();
  }

  function updateCommitment(id, data) {
    items = items.map((item) => (item.id === id ? { ...item, ...data } : item));
    render();
  }

  function removeCommitment(id) {
    items = items.filter((item) => item.id !== id);
    render();
  }

  function readForm() {
    const formData = new FormData(form);

    const colaboradores = formData
      .get("colaboradores")
      .split(",")
      .map((nombre) => nombre.trim())
      .filter(Boolean);

    return {
      colaboradores,
      descripcion: formData.get("descripcion").trim(),
      fechaInicio: formData.get("fechaInicio"),
      fechaLimite: formData.get("fechaLimite"),
      estado: formData.get("estado"),
      prioridad: formData.get("prioridad"),

    };
  }

  function fillForm(data) {
    form.elements.colaboradores.value = data.colaboradores.join(", ");
    form.elements.descripcion.value = data.descripcion;
    form.elements.fechaInicio.value = data.fechaInicio;
    form.elements.fechaLimite.value = data.fechaLimite;
    form.elements.estado.value = data.estado;
    form.elements.prioridad.value = data.prioridad;
  }

  function openDialogForNew() {
    editingId = null;
    formTitle.textContent = "Nuevo compromiso";
        saveBtn.textContent = "Guardar"

    dialog.showModal();
  }

  function openDialogForEdit(id) {
    const data = items.find((item) => item.id === id);
    editingId = id;
    fillForm(data);
    formTitle.textContent = "Editar compromiso";
    saveBtn.textContent = "Actualizar"
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
    form.reset();
    editingId = null;
  }

  addBtn.addEventListener("click", openDialogForNew);
  cancelBtn.addEventListener("click", closeDialog);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readForm();

    if (editingId === null) {
      addCommitment(data);
    } else {
      updateCommitment(editingId, data);
    }

    closeDialog();
  });

  list.addEventListener("click", (event) => {
    const card = event.target.closest(".commitment-card");
    if (!card) return;

    if (event.target.matches(".commitment-card__delete")) {
      removeCommitment(card.dataset.id);
    }
  });

  list.addEventListener("dblclick", (event)=>{
    const card = event.target.closest(".commitment-card");
    if(!card) return;

    openDialogForEdit(card.dataset.id)
  })

  render();
}