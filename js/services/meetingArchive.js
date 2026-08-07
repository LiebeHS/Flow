import { loadData, saveData } from "./storage.service.js";
import { getReunionActivaId, clearReunionActiva } from "./session.js";

const HISTORIAL_KEY = "flow.historial";
const PENDIENTES_KEY = "flow.pendientes";

const SECCIONES = [
  "objetivos", "asuntos", "compromisos", "desarrollo",
  "otros", "competitividad", "acuerdos", "reflexion", "enlaces",
];

function leerSeccion(id, seccion, fallback) {
  return loadData(`flow.reunion.${id}.${seccion}`, fallback);
}

function empaquetarReunion(id) {
  const reunion = {
    meta: loadData(`flow.reunion.${id}.meta`, {}),
    secciones: {},
  };

  SECCIONES.forEach((seccion) => {
    const fallback = seccion === "desarrollo" ? {} : [];
    reunion.secciones[seccion] = leerSeccion(id, seccion, fallback);
  });

  return reunion;
}

function calcularPendientes(id) {
  const objetivos = leerSeccion(id, "objetivos", []);
  const compromisos = leerSeccion(id, "compromisos", []);
  const desarrollo = leerSeccion(id, "desarrollo", {});

  const objetivosPendientes = objetivos.filter((o) => !o.done);

  const compromisosPendientes = compromisos.filter((c) => c.estado !== "completado");

  const desarrolloPendiente = {};
    objetivosPendientes.forEach((obj) => {
    if (desarrollo[obj.id]) {
      desarrolloPendiente[obj.id] = desarrollo[obj.id];
    }
  });


  return {
    objetivos: objetivosPendientes,
    compromisos: compromisosPendientes,
    desarrollo: desarrolloPendiente,
  };
}

export function terminarReunion() {
  const id = getReunionActivaId();
  if (id === null) return;

  const reunion = empaquetarReunion(id);
  reunion.meta.estado = "terminada";
  reunion.meta.fechaTermino = new Date().toISOString();

  const historial = loadData(HISTORIAL_KEY, []);
  historial.push(reunion);
  saveData(HISTORIAL_KEY, historial);

  const pendientes = calcularPendientes(id);
  saveData(PENDIENTES_KEY, pendientes);

  limpiarDatosReunion(id);
  clearReunionActiva();
}

function limpiarDatosReunion(id){
    localStorage.removeItem(`flow.reunion.${id}.meta`);
    SECCIONES.forEach((section)=>{
        localStorage.removeItem(`flow.reunion.${id}.${section}`)
    })
}