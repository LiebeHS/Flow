import { loadData, saveData } from "./storage.service.js";

const PENDIENTES_KEY = "flow.pendientes";

export function heredarPendientes(nuevoId, { heredarCompromisos = true } = {}) {
  const pendientes = loadData(PENDIENTES_KEY, null);
  if (!pendientes) return;

  // 1. Objetivos: id nuevo, sin completar
  const objetivos = (pendientes.objetivos || []).map((o) => ({
    id: crypto.randomUUID(),
    texto: o.texto,
    done: false,
  }));

  // 2. Compromisos: id nuevo (solo si se decidió heredarlos)
  const compromisos = heredarCompromisos
    ? (pendientes.compromisos || []).map((c) => ({
        ...c,
        id: crypto.randomUUID(),
      }))
    : [];

  // 3. Mapa de objetivo viejo → nuevo (para reconectar el desarrollo)
  const mapaObjetivos = {};
  (pendientes.objetivos || []).forEach((viejo, i) => {
    mapaObjetivos[viejo.id] = objetivos[i].id;
  });

  // 4. Desarrollo: copiar los bloques completos, reasignando ids
  const desarrollo = {};
  const desarrolloPendiente = pendientes.desarrollo || {};
  for (const objetivoIdViejo in desarrolloPendiente) {
    const nuevoObjetivoId = mapaObjetivos[objetivoIdViejo];
    if (!nuevoObjetivoId) continue;

    desarrollo[nuevoObjetivoId] = desarrolloPendiente[objetivoIdViejo].map((bloque) => ({
      ...bloque,
      id: crypto.randomUUID(),
    }));
  }

  // 5. Sembrar en la reunión nueva
  saveData(`flow.reunion.${nuevoId}.objetivos`, objetivos);
  saveData(`flow.reunion.${nuevoId}.compromisos`, compromisos);
  saveData(`flow.reunion.${nuevoId}.desarrollo`, desarrollo);

  // 6. Consumir
  saveData(PENDIENTES_KEY, null);
}