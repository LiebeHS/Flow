import {
  loadData,
  saveData
} from "./storage.service.js";

import {
  getReunionActivaId,
  clearReunionActiva
} from "./session.js";

import {
  agruparPorPrioridad
} from "../utils/agruparPorPrioridad.js";


/* =========================================================
   CLAVES DE STORAGE
   ========================================================= */

const HISTORIAL_KEY =
  "flow.historial";

const PENDIENTES_KEY =
  "flow.pendientes";


/* =========================================================
   SECCIONES DE UNA REUNIÓN
   ========================================================= */

const SECCIONES = [
  "objetivos",
  "asuntos",
  "compromisos",
  "desarrollo",
  "otros",
  "competitividad",
  "acuerdos",
  "reflexion",
  "enlaces"
];


/* =========================================================
   LEER SECCIÓN
   ========================================================= */

function leerSeccion(
  id,
  seccion,
  fallback
) {

  return loadData(
    `flow.reunion.${id}.${seccion}`,
    fallback
  );

}


/* =========================================================
   EMPAQUETAR REUNIÓN
   ========================================================= */

function empaquetarReunion(id) {

  const reunion = {

    meta:
      loadData(
        `flow.reunion.${id}.meta`,
        {}
      ),

    secciones: {}

  };


  SECCIONES.forEach(
    (seccion) => {

      const fallback =
        seccion === "desarrollo"
          ? {}
          : [];


      reunion.secciones[seccion] =
        leerSeccion(
          id,
          seccion,
          fallback
        );

    }
  );


  return reunion;

}


/* =========================================================
   CALCULAR PENDIENTES
   ========================================================= */

function calcularPendientes(id) {

  const objetivos =
    leerSeccion(
      id,
      "objetivos",
      []
    );


  const compromisos =
    leerSeccion(
      id,
      "compromisos",
      []
    );


  const desarrollo =
    leerSeccion(
      id,
      "desarrollo",
      {}
    );


  /*
   * Objetivos que no fueron completados
   */

  const objetivosPendientes =
    objetivos.filter(
      (objetivo) =>
        !objetivo.done
    );


  /*
   * Compromisos que no fueron completados.
   *
   * Los que ya se mostraron una vez como "vencido"
   * informativo (vencidoInformativo === true) no se
   * vuelven a heredar en una segunda reunión.
   */

  const compromisosPendientes =
    compromisos
      .filter(
        (compromiso) =>
          compromiso.estado !== "completado" &&
          !compromiso.vencidoInformativo
      )
      .map(
        (compromiso) => {

          const vencido =
            compromiso.fechaLimite &&
            new Date(compromiso.fechaLimite) < new Date();


          return vencido
            ? { ...compromiso, vencidoInformativo: true }
            : compromiso;

        }
      );


  /*
   * Desarrollo asociado a objetivos pendientes
   */

  const desarrolloPendiente = {};


  objetivosPendientes.forEach(
    (objetivo) => {

      if (
        desarrollo[objetivo.id]
      ) {

        /*
         * Los puntos ya completados al 100%
         * no se heredan a la siguiente reunión.
         */

        const bloquesVigentes =
          desarrollo[objetivo.id].filter(
            (bloque) =>
              !(
                bloque.tipo === "punto" &&
                bloque.avance === 100
              )
          );


        desarrolloPendiente[
          objetivo.id
        ] =
          agruparPorPrioridad(
            bloquesVigentes
          );

      }

    }
  );


  return {

    objetivos:
      objetivosPendientes,

    compromisos:
      compromisosPendientes,

    desarrollo:
      desarrolloPendiente

  };

}


/* =========================================================
   TERMINAR REUNIÓN
   ========================================================= */

export function terminarReunion() {

  /*
   * Obtener la reunión actualmente activa
   */

  const id =
    getReunionActivaId();


  /*
   * No hay reunión activa
   */

  if (
    id === null ||
    id === undefined
  ) {

    console.warn(
      "No existe una reunión activa para terminar."
    );

    return false;

  }


  /*
   * Recuperar todos los datos
   * de la reunión actual
   */

  const reunion =
    empaquetarReunion(id);


  /*
   * Validar que realmente exista
   * la información principal
   */

  if (
    !reunion.meta ||
    !reunion.meta.id
  ) {

    console.error(
      "No se encontró la información de la reunión activa:",
      id
    );

    return false;

  }


  /* =====================================================
     ACTUALIZAR ESTADO
     ===================================================== */

  reunion.meta.estado =
    "terminada";


  reunion.meta.fechaTermino =
    new Date().toISOString();


  /*
   * Mantener la fecha de inicio
   * si ya existe.
   *
   * No se modifica:
   *
   * reunion.meta.fecha
   *
   * porque representa la fecha programada
   * de la reunión.
   */


  /* =====================================================
     GUARDAR EN HISTORIAL
     ===================================================== */

  const historial =
    loadData(
      HISTORIAL_KEY,
      []
    );


  historial.push(
    reunion
  );


  saveData(
    HISTORIAL_KEY,
    historial
  );


  /* =====================================================
     GUARDAR PENDIENTES
     ===================================================== */

  const pendientes =
    calcularPendientes(id);


  saveData(
    PENDIENTES_KEY,
    pendientes
  );


  /*
   * Ya no se borran los datos locales de la reunión aquí:
   * sigue siendo editable (desde la vista de Archivo)
   * mientras dure el día calendario en que se terminó.
   */


  /* =====================================================
     LIMPIAR SESIÓN ACTIVA
     ===================================================== */

  clearReunionActiva();


  return true;

}