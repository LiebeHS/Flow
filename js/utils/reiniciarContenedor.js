/* =========================================================
   REINICIAR CONTENEDOR
   ========================================================= */

/*
 * Clona y reemplaza un elemento del DOM antes de volver a
 * montar un componente sobre él. Los componentes de la
 * reunión (desarrollo, objetivos, compromisos, etc.) se
 * pueden volver a montar varias veces sobre el MISMO HTML
 * persistente (una reunión nueva en la misma pestaña, o
 * reabrir una reunión finalizada para editarla) — sin este
 * paso, cada montaje deja sus propios listeners pegados al
 * HTML anterior y se acumulan indefinidamente.
 */

export function reiniciarContenedor(selector) {

    const elemento =
        document.querySelector(
            selector
        );


    if (!elemento) {

        return null;

    }


    const clon =
        elemento.cloneNode(
            true
        );


    elemento.replaceWith(
        clon
    );


    return clon;

}
