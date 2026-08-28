/* =========================================================
   REORDENAR PUNTOS DE ALTA PRIORIDAD DEBAJO DE SU SUBTÍTULO
   ========================================================= */

/*
 * Los subtítulos NUNCA cambian de posición entre sí. Dentro de
 * los bloques que le pertenecen a cada subtítulo (o del grupo
 * inicial, si hay bloques antes del primer subtítulo), los
 * puntos marcados como alta prioridad se mueven justo debajo
 * del subtítulo, antes que el resto (puntos normales, párrafos).
 */

export function agruparPorPrioridad(bloques) {

  const grupos = [];

  let actual = {
    subtitulo: null,
    items: []
  };

  bloques.forEach(
    (bloque) => {

      if (
        bloque.tipo === "subtitulo"
      ) {

        grupos.push(actual);

        actual = {
          subtitulo: bloque,
          items: []
        };

      }
      else {

        actual.items.push(bloque);

      }

    }
  );

  grupos.push(actual);


  const esPrioritario = (bloque) =>
    bloque.tipo === "punto" &&
    bloque.prioridad;


  return grupos.flatMap(
    (grupo) => {

      const prioritarios =
        grupo.items.filter(esPrioritario);

      const normales =
        grupo.items.filter(
          (bloque) => !esPrioritario(bloque)
        );

      const itemsOrdenados = [
        ...prioritarios,
        ...normales
      ];

      return grupo.subtitulo
        ? [grupo.subtitulo, ...itemsOrdenados]
        : itemsOrdenados;

    }
  );

}
