import { loadData, saveData } from "./storage.service.js";

const ACTIVE_KEY = "flow.reunion-activa";

let reunionActivaId = loadData(ACTIVE_KEY, null);

export function getReunionActivaId() {
  return reunionActivaId;
}

export function setReunionActivaId(id) {
  reunionActivaId = id;
  saveData(ACTIVE_KEY, id);
}

export function clearReunionActiva() {
  reunionActivaId = null;
  saveData(ACTIVE_KEY, null);
}

export function hayReunionActiva() {
  return reunionActivaId !== null;
}

export function sectionKey(seccion) {
  return `flow.reunion.${reunionActivaId}.${seccion}`;
}