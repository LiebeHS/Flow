import { loadData, saveData } from "../services/storage.service.js";

const TIPO_CLASS = {
  subtitulo: "development-block--subtitulo",
  punto: "development-block--punto",
  parrafo: "development-block--parrafo",
};
const PLACEHOLDER = {
  subtitulo: "Escribe un subtitulo...",
  punto: "Coloca un punto...",
  parrafo: "Escribe un párrafo...",
};
const AVANCE_CLASS = [
  {max: 33, clase: "avance--bajo"},
  {max: 66, clase: "avance--medio"},
  {max: 99, clase: "avance--alto"},
  {max: 100, clase: "avance--completo"},
]


export function createDevelopmentTable({ container, storageKey }) {
  const table = container.querySelector(".development__table");

  let objetivos = [];
  let contenidos = normalize(loadData(storageKey, {}));//* Es un objeto que apunta a un arreglo de bloques
  let focusBlockId = null;
  let isEditing = false;

  function normalize(data) {//*Blindaje en caso de que alguien pegue contenido de otra fuente
    const result = {};

    for (const id in data) {
      const value = data[id];

      if (typeof value === "string") {
        result[id] = value.trim()
          ? [{ id: crypto.randomUUID(), tipo: "parrafo", texto: value }]
          : [];
      } else {
        result[id] = value;
      }
    }

    return result;
  }

  function claseAvance(valor){
    return AVANCE_CLASS.find((rango)=> valor <= rango.max).clase;
  }

  function persist() {
    saveData(storageKey, contenidos);
  }

  function getBlocks(objetivoId) {//* getBlocks garantiza que siempre haya un array con el que trabajar
    if (!contenidos[objetivoId]) contenidos[objetivoId] = [];
    return contenidos[objetivoId];
  }

  function addBlock(objetivoId, tipo, index = null) {
    const block = { id: crypto.randomUUID(), tipo, texto: "" };
    const blocks = getBlocks(objetivoId);

   if(index === null){
    blocks.push(block);
   }else{
    blocks.splice(index, 0, block)
   }
   focusBlockId = block.id;
   persist();
   render();
  }

  function removeBlock(objetivoId, blockId) {
    contenidos[objetivoId] = getBlocks(objetivoId).filter((b) => b.id !== blockId);
    persist();
    render();
  }

  function updateBlockText(objetivoId, blockId, texto) {
    const block = getBlocks(objetivoId).find((b) => b.id === blockId);
    if (block) block.texto = texto;
    persist();
  }
  
  function updateBlockAvance(objetivoId, blockId, avance) {
    //console.log("updateblockavance recibe:", avance, typeof avance);
    const block = getBlocks(objetivoId).find((b) => b.id === blockId);
    if (block) block.avance = avance;
    persist();
  }

  
  function createAddButton(tipo, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("development__add-btn");
    btn.dataset.tipo = tipo;
    btn.textContent = label;
    return btn;
  }



  function createBlockElement(block) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("development-block");
    wrapper.classList.add(TIPO_CLASS[block.tipo]);
    wrapper.dataset.blockId = block.id;

    if (block.tipo === "punto") {
      const bullet = document.createElement("span");
      bullet.classList.add("development-block__bullet");
      bullet.textContent = "•";
      wrapper.appendChild(bullet);
    }

    const field = document.createElement("textarea");
    field.classList.add("development-block__field");
    field.rows = 1;
    field.value = block.texto;
    field.placeholder = PLACEHOLDER[block.tipo];

    wrapper.appendChild(field)

    //!-------------------------------------------------------------------------------------    
      if (block.tipo === "punto") {
    const avance = block.avance ?? 0;

    const progress = document.createElement("div");
    progress.classList.add("avance");

    const bar = document.createElement("div");
    bar.classList.add("avance__bar");
    bar.classList.add(claseAvance(avance));
    bar.style.width = `${avance}%`;

    const track = document.createElement("div");
    track.classList.add("avance__track");
    track.appendChild(bar);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = avance;
    slider.classList.add("avance__slider");
    slider.setAttribute("aria-label", "Porcentaje de avance");

    const value = document.createElement("span");
    value.classList.add("avance__value");
    value.textContent = `${avance}%`;

    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.classList.add("avance__complete");
    completeBtn.textContent = "✓";
    completeBtn.setAttribute("aria-label", "Marcar como completado (100%)");

    progress.append(slider, track, value, completeBtn);
    wrapper.appendChild(progress);
  }

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.classList.add("development-block__delete");
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", "Eliminar bloque");

    wrapper.appendChild(deleteBtn);
    return wrapper;

  }
  function createEditToggle() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("development__edit-toggle");
  btn.textContent = "Editar estructura";
  btn.setAttribute("aria-pressed", "false");

  btn.addEventListener("click", () => {
    isEditing = !isEditing;
    table.classList.toggle("development--editing", isEditing);
    btn.classList.toggle("development__edit-toggle--active", isEditing);
    btn.textContent = isEditing ? "Terminar edición" : "Editar estructura";
    btn.setAttribute("aria-pressed", String(isEditing));
  });

  return btn;
}

  function createRow(objetivo) {
    const row = document.createElement("div");
    row.classList.add("development__row");
    row.dataset.id = objetivo.id;

    const left = document.createElement("div");
    left.classList.add("development__objective");
    left.textContent = objetivo.texto;

    const right = document.createElement("div");
    right.classList.add("development__blocks");

    const blocks = getBlocks(objetivo.id);

    blocks.forEach((block, i) => {
      right.appendChild(createInsertZone(i))
      right.appendChild(createBlockElement(block));
    });

    right.appendChild(createInsertZone(blocks.length));//* zona DESPUÉS del último

    const toolbar = document.createElement("div");
    toolbar.classList.add("development__toolbar");
    toolbar.append(
      createAddButton("subtitulo", "+ Subtítulo"),
      createAddButton("punto", "+ Punto"),
      createAddButton("parrafo", "+ Párrafo")
    );

    right.appendChild(toolbar);
    row.append(left, right);
    return row;
  }

  function createInsertZone(index) {
  const zone = document.createElement("div");
  zone.classList.add("insert-zone");
  zone.dataset.index = index;

  const trigger = document.createElement("span");
  trigger.classList.add("insert-zone__trigger");
  trigger.textContent = "+";
  trigger.setAttribute("aria-hidden", "true");

  const menu = document.createElement("div");
  menu.classList.add("insert-zone__menu");
  menu.append(
    createInsertButton("subtitulo", "+ Subtítulo", index),
    createInsertButton("punto", "+ Punto", index),
    createInsertButton("parrafo", "+ Párrafo", index)
  );

  zone.append(trigger, menu);
  return zone;
}

function createInsertButton(tipo, label, index) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("insert-zone__btn");
  btn.dataset.tipo = tipo;
  btn.dataset.index = index;
  btn.textContent = label;
  return btn;
}

  function autoGrow(field) {
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }

  function render() {
    const rows = objetivos.map(createRow);
    table.replaceChildren(...rows);

    table.querySelectorAll(".development-block__field").forEach(autoGrow);

    if (focusBlockId !== null) {
      const field = table.querySelector(
        `[data-block-id="${focusBlockId}"] .development-block__field`
      );
      if (field) field.focus();
      focusBlockId = null;
    }
  }

  function limpiarHuerfanos() {
    const idsValidos = objetivos.map((obj) => obj.id);

    Object.keys(contenidos).forEach((id) => {
      if (!idsValidos.includes(id)) delete contenidos[id];
    });

    persist();
  }

  function refreshTextAreas(){
    table.querySelectorAll(".development-block__field").forEach(autoGrow);
  }

  function refreshAvanceUI(wrapper, valor) {
  const bar = wrapper.querySelector(".avance__bar");
  const value = wrapper.querySelector(".avance__value");
  const slider = wrapper.querySelector(".avance__slider");

  bar.style.width = `${valor}%`;
  bar.classList.remove("avance--bajo", "avance--medio", "avance--alto", "avance--completo");
  bar.classList.add(claseAvance(valor));
  value.textContent = `${valor}%`;
  slider.value = valor;
}


  function setObjetivos(nuevosObjetivos) {
    objetivos = nuevosObjetivos;
    limpiarHuerfanos();
    render();
  }

  table.addEventListener("click", (event) => {
    const row = event.target.closest(".development__row");
    if (!row) return;

    const objetivoId = row.dataset.id;

      if(event.target.matches(".insert-zone__btn")){
      const index = Number(event.target.dataset.index);
      console.log("tipo", event.target.dataset.tipo, "| index:", index);
      addBlock(objetivoId, event.target.dataset.tipo, index);
      return;
    }

    if (event.target.matches(".development__add-btn")) {
      addBlock(objetivoId, event.target.dataset.tipo);
      return;
    }

    if (event.target.matches(".development-block__delete")) {
      const block = event.target.closest(".development-block");
      removeBlock(objetivoId, block.dataset.blockId);
    }

    if(event.target.matches(".avance__complete")){
      const block = event.target.closest(".development-block");
      updateBlockAvance(objetivoId, block.dataset.blockId, 100);
      refreshAvanceUI(block, 100);
      return;
    }

  

  });

 table.addEventListener("input", (event) => {
  const row = event.target.closest(".development__row");
  const block = event.target.closest(".development-block");

  if (event.target.matches(".development-block__field")) {
    updateBlockText(row.dataset.id, block.dataset.blockId, event.target.value);
    autoGrow(event.target);
    return;
  }

  if (event.target.matches(".avance__slider")) {
    const valor = Number(event.target.value);
    updateBlockAvance(row.dataset.id, block.dataset.blockId, valor);
    refreshAvanceUI(block, valor);
  }
});
  const existente = container.querySelector(".development__edit-toggle");
if (existente) existente.remove();
  container.insertBefore(createEditToggle(), table);
  return { setObjetivos, refreshTextAreas };
}