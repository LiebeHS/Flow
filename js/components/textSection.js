import { loadData, saveData } from "../services/storage.service.js";

export function createTextSection({ container, storageKey, placeholder = "Escribe aquí…" }) {
  const wrapper = container.querySelector(".text-section");
  wrapper.replaceChildren();
  const field = document.createElement("textarea");
  field.classList.add("text-section__field");
  field.placeholder = placeholder;
  field.value = loadData(storageKey, "");

  function autoGrow() {
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }

  field.addEventListener("input", () => {
    saveData(storageKey, field.value);
    autoGrow();
  });

  wrapper.appendChild(field);
  requestAnimationFrame(autoGrow);
}