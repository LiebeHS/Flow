import { loadData, saveData } from "../services/storage.service.js";

export function createLinkList({ container, storageKey }) {
  const list = container.querySelector(".link-list__list");
  const titleInput = container.querySelector(".link-list__title");
  const urlInput = container.querySelector(".link-list__url");
  const addBtn = container.querySelector(".link-list__add");

  let items = loadData(storageKey);

  function esUrlValida(url) {
    return url.startsWith("http://") || url.startsWith("https://");
  }

  function createItem(data) {
    const item = document.createElement("li");
    item.classList.add("link-list__item");
    item.dataset.id = data.id;

    const link = document.createElement("a");
    link.classList.add("link-list__link");
    link.href = data.url;
    link.textContent = data.titulo;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.classList.add("link-list__delete");
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", "Eliminar enlace");

    item.append(link, deleteBtn);
    return item;
  }

  function render() {
    const elements = items.map(createItem);
    list.replaceChildren(...elements);
    saveData(storageKey, items);
  }

  function addItem(titulo, url) {
    items.push({ id: crypto.randomUUID(), titulo, url });
    render();
  }

  function removeItem(id) {
    items = items.filter((item) => item.id !== id);
    render();
  }

  function handleAdd() {
    const titulo = titleInput.value.trim();
    const url = urlInput.value.trim();

    if (titulo === "" || url === "") return;

    if (!esUrlValida(url)) {
      alert("La URL debe empezar por http:// o https://");
      return;
    }

    addItem(titulo, url);
    titleInput.value = "";
    urlInput.value = "";
    titleInput.focus();
  }

  addBtn.addEventListener("click", handleAdd);

  urlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleAdd();
  });

  list.addEventListener("click", (event) => {
    if (!event.target.matches(".link-list__delete")) return;

    const item = event.target.closest(".link-list__item");
    removeItem(item.dataset.id);
  });

  render();
}