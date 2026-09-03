/* =========================================================
   HISTORY VIEW
   ========================================================= */

import {
    capitalizar
} from "../utils/capitalize.js";

import {
    API_URL
} from "./config.js";

import {
    confirmDialog
} from "../services/confirmDialog.js";

import {
    getReunionActivaId
} from "../services/session.js";


/* =========================================================
   CREAR VISTA DE HISTORIAL
   ========================================================= */

export function createHistoryView({
    container,
    onOpen
}) {

    const list =
        container.querySelector(
            ".historial__list"
        );


    /* =====================================================
       VALIDAR CONTENEDOR
       ===================================================== */

    if (!list) {

        console.error(
            "No se encontró .historial__list"
        );

        return {

            render:
                () => {}

        };

    }


    /* =========================================================
       FORMATEAR FECHA
       ========================================================= */

    function formatearFecha(
        fecha
    ) {

        if (!fecha) {

            return "-";

        }


        const d =
            new Date(
                fecha
            );


        if (
            Number.isNaN(
                d.getTime()
            )
        ) {

            return "-";

        }


        const dia =
            String(
                d.getDate()
            ).padStart(
                2,
                "0"
            );


        const mes =
            capitalizar(
                d.toLocaleDateString(
                    "es-MX",
                    {
                        month:
                            "short"
                    }
                )
            );


        const anio =
            d.getFullYear();


        return (
            `${dia}/${mes}/${anio}`
        );

    }


    /* =========================================================
       FORMATEAR HORA
       ========================================================= */

    function formatearHora(
        fecha
    ) {

        if (!fecha) {

            return "";

        }


        const d =
            new Date(
                fecha
            );


        if (
            Number.isNaN(
                d.getTime()
            )
        ) {

            return "";

        }


        return d.toLocaleTimeString(
            "es-MX",
            {
                hour:
                    "numeric",

                minute:
                    "2-digit",

                hour12:
                    true

            }
        );

    }


    /* =========================================================
       OBTENER REUNIONES PROGRAMADAS
       ========================================================= */

    async function obtenerReunionesProgramadas() {

        try {

            const response =
                await fetch(
                    `${API_URL}/reuniones/programadas`
                );


            const data =
                await response.json();


            if (
                !response.ok
            ) {

                throw new Error(
                    data.mensaje ||
                    data.error ||
                    "No fue posible obtener las reuniones programadas."
                );

            }


            return (
                data.reuniones ||
                []
            );

        }
        catch (error) {

            console.error(
                "ERROR OBTENIENDO REUNIONES PROGRAMADAS:",
                error
            );


            return [];

        }

    }


    /* =========================================================
       OBTENER HISTORIAL
       ========================================================= */

    async function obtenerHistorial() {

        try {

            const response =
                await fetch(
                    `${API_URL}/reuniones/historial`
                );


            const data =
                await response.json();


            if (
                !response.ok
            ) {

                throw new Error(
                    data.mensaje ||
                    data.error ||
                    "No fue posible obtener el historial."
                );

            }


            return (
                data.reuniones ||
                []
            );

        }
        catch (error) {

            console.error(
                "ERROR OBTENIENDO HISTORIAL:",
                error
            );


            return [];

        }

    }


    /* =========================================================
       ELIMINAR REUNIÓN
       ========================================================= */

    async function eliminarReunion(
        reunionId
    ) {

        if (
            reunionId ===
            getReunionActivaId()
        ) {

            alert(
                "No puedes eliminar la reunión que está en curso."
            );

            return;

        }


        const confirmado =
            await confirmDialog(
                "¿Eliminar esta reunión? Se borrará junto con sus objetivos, compromisos y participantes. Esta acción no se puede deshacer.",
                { danger: true }
            );

        if (!confirmado) {

            return;

        }


        try {

            const response =
                await fetch(
                    `${API_URL}/reuniones/${reunionId}`,
                    {

                        method:
                            "DELETE"

                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.mensaje ||
                    data.error ||
                    "No fue posible eliminar la reunión."
                );

            }


            await render();

        }
        catch (error) {

            console.error(
                "ERROR ELIMINANDO REUNIÓN:",
                error
            );

            alert(
                error.message ||
                "No fue posible eliminar la reunión."
            );

        }

    }


    /* =========================================================
       BOTÓN ELIMINAR
       ========================================================= */

    function crearBotonEliminar(
        reunionId
    ) {

        const boton =
            document.createElement(
                "button"
            );

        boton.type =
            "button";

        boton.classList.add(
            "history-card__delete"
        );

        boton.dataset.reunionId =
            reunionId;

        boton.setAttribute(
            "aria-label",
            "Eliminar reunión"
        );

        boton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="4,7 20,7"></polyline>
                <path d="M9 7V4h6v3"></path>
                <path d="M6 7l1 13h10l1-13"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `;

        return boton;

    }


    /* =========================================================
       CARD - REUNIÓN PROGRAMADA
       ========================================================= */

    function crearTarjetaProgramada(
        reunion
    ) {

        const card =
            document.createElement(
                "article"
            );


        card.classList.add(
            "history-card",
            "history-card--programada"
        );


        /*
         * ID REAL DE MYSQL
         */

        card.dataset.id =
            reunion.ReunionId;


        /* ---------------------------------------------
           HEADER
           --------------------------------------------- */

        const header =
            document.createElement(
                "div"
            );


        header.classList.add(
            "history-card__header"
        );


        const fecha =
            document.createElement(
                "span"
            );


        fecha.classList.add(
            "history-card__date"
        );


        fecha.textContent =
            formatearFecha(
                reunion.FechaInicio
            );


        const enCurso =
            reunion.Estado === "En curso";


        const badge =
            document.createElement(
                "span"
            );


        badge.classList.add(
            "history-card__badge",
            enCurso
                ? "history-card__badge--en-curso"
                : "history-card__badge--programada"
        );


        badge.textContent =
            enCurso
                ? "En curso"
                : "Programada";


        header.append(
            fecha,
            badge,
            crearBotonEliminar(
                reunion.ReunionId
            )
        );


        /* ---------------------------------------------
           TÍTULO
           --------------------------------------------- */

        const title =
            document.createElement(
                "h3"
            );


        title.classList.add(
            "history-card__title"
        );


        title.textContent =
            reunion.Titulo ||
            "Reunión Flow";


        /* ---------------------------------------------
           HORA
           --------------------------------------------- */

        const hora =
            document.createElement(
                "div"
            );


        hora.classList.add(
            "history-card__time"
        );


        hora.textContent =
            formatearHora(
                reunion.FechaInicio
            );


        /* ---------------------------------------------
           PARTICIPANTES
           --------------------------------------------- */

        const parts =
            document.createElement(
                "div"
            );


        parts.classList.add(
            "history-card__parts"
        );


        const numParticipantes =
            Number(
                reunion.TotalParticipantes
            ) || 0;


        parts.textContent =
            `${numParticipantes} participante${
                numParticipantes !== 1
                    ? "s"
                    : ""
            }`;


        /* ---------------------------------------------
           ACCIÓN
           --------------------------------------------- */

        const action =
            document.createElement(
                "div"
            );


        action.classList.add(
            "history-card__action"
        );


        action.textContent =
            enCurso
                ? "Clic para continuar →"
                : "Clic para iniciar →";


        /* ---------------------------------------------
           ARMAR CARD
           --------------------------------------------- */

        card.append(
            header,
            title,
            hora,
            parts,
            action
        );


        return card;

    }


    /* =========================================================
       CARD - HISTORIAL
       ========================================================= */

    function crearTarjetaHistorial(
        reunion
    ) {

        const card =
            document.createElement(
                "article"
            );


        card.classList.add(
            "history-card"
        );


        /*
         * IMPORTANTE:
         * usamos ReunionId.
         * Ya no usamos índice de localStorage.
         */

        card.dataset.reunionId =
            reunion.ReunionId;


        /* ---------------------------------------------
           HEADER
           --------------------------------------------- */

        const header =
            document.createElement(
                "div"
            );


        header.classList.add(
            "history-card__header"
        );


        const fecha =
            document.createElement(
                "span"
            );


        fecha.classList.add(
            "history-card__date"
        );


        fecha.textContent =
            formatearFecha(
                reunion.FechaInicio
            );


        /* ---------------------------------------------
           ESTADO
           --------------------------------------------- */

        const badge =
            document.createElement(
                "span"
            );


        badge.classList.add(
            "history-card__badge"
        );


        const totalObjetivos =
            Number(
                reunion.TotalObjetivos
            ) || 0;


        const totalCompromisos =
            Number(
                reunion.TotalCompromisos
            ) || 0;


        const pendientes =
            totalObjetivos +
            totalCompromisos;


        if (
            reunion.Estado ===
            "Finalizada"
        ) {

            badge.classList.add(
                "history-card__badge--cerrada"
            );


            if (
                pendientes === 0
            ) {

                badge.textContent =
                    "Todo cerrado";

            }
            else {

                badge.textContent =
                    `${pendientes} pendientes`;

            }

        }
        else {

            badge.classList.add(
                "history-card__badge--pendiente"
            );


            badge.textContent =
                `${pendientes} pendientes`;

        }


        header.append(
            fecha,
            badge,
            crearBotonEliminar(
                reunion.ReunionId
            )
        );


        /* ---------------------------------------------
           TÍTULO
           --------------------------------------------- */

        const title =
            document.createElement(
                "h3"
            );


        title.classList.add(
            "history-card__title"
        );


        title.textContent =
            reunion.Titulo ||
            "Reunión Flow";


        /* ---------------------------------------------
           PARTICIPANTES
           --------------------------------------------- */

        const parts =
            document.createElement(
                "div"
            );


        parts.classList.add(
            "history-card__parts"
        );


        const totalParticipantes =
            Number(
                reunion.TotalParticipantes
            ) || 0;


        parts.textContent =
            `${totalParticipantes} participante${
                totalParticipantes !== 1
                    ? "s"
                    : ""
            }`;


        /* ---------------------------------------------
           ESTADÍSTICAS
           --------------------------------------------- */

        const stats =
            document.createElement(
                "div"
            );


        stats.classList.add(
            "history-card__stats"
        );


        const objetivos =
            document.createElement(
                "span"
            );


        objetivos.innerHTML =
            `<b>${totalObjetivos}</b> objetivos`;


        const compromisos =
            document.createElement(
                "span"
            );


        compromisos.innerHTML =
            `<b>${totalCompromisos}</b> compromisos`;


        stats.append(
            objetivos,
            compromisos
        );


        /* ---------------------------------------------
           ARMAR CARD
           --------------------------------------------- */

        card.append(
            header,
            title,
            parts,
            stats
        );


        return card;

    }


    /* =========================================================
       CREAR SECCIÓN
       ========================================================= */

    function crearSeccion(
        tituloTexto,
        clase,
        tarjetas
    ) {

        const section =
            document.createElement(
                "section"
            );


        section.classList.add(
            "history-view__section",
            clase
        );


        /* ---------------------------------------------
           TÍTULO
           --------------------------------------------- */

        const titulo =
            document.createElement(
                "h2"
            );


        titulo.classList.add(
            "history-view__section-title"
        );


        titulo.textContent =
            tituloTexto;


        /* ---------------------------------------------
           CONTENEDOR DE TARJETAS
           --------------------------------------------- */

        const tarjetasContainer =
            document.createElement(
                "div"
            );


        if (
            clase ===
            "history-view__section--programadas"
        ) {

            tarjetasContainer.classList.add(
                "history-view__programadas"
            );

        }
        else {

            tarjetasContainer.classList.add(
                "history-view__historial"
            );

        }


        tarjetasContainer.append(
            ...tarjetas
        );


        section.append(
            titulo,
            tarjetasContainer
        );


        return section;

    }


    /* =========================================================
       RENDER
       ========================================================= */

    async function render() {

        let historial =
            [];


        let programadas =
            [];


        /* ---------------------------------------------
           HISTORIAL
           --------------------------------------------- */

        historial =
            await obtenerHistorial();


        /* ---------------------------------------------
           PROGRAMADAS
           --------------------------------------------- */

        programadas =
            await obtenerReunionesProgramadas();


        /* ---------------------------------------------
           LIMPIAR
           --------------------------------------------- */

        list.replaceChildren();


        /* =================================================
           LAYOUT
           ================================================= */

        const layout =
            document.createElement(
                "div"
            );


        layout.classList.add(
            "history-view__layout"
        );


        /* =================================================
           PROGRAMADAS
           ================================================= */

        if (
            programadas.length > 0
        ) {

            const tarjetasProgramadas =
                [...programadas]
                    .sort(
                        (a, b) =>
                            b.ReunionId -
                            a.ReunionId
                    )
                    .map(
                        crearTarjetaProgramada
                    );


            layout.appendChild(
                crearSeccion(
                    "Próximas reuniones",
                    "history-view__section--programadas",
                    tarjetasProgramadas
                )
            );

        }


        /* =================================================
           HISTORIAL
           ================================================= */

        if (
            historial.length > 0
        ) {

            const tarjetasHistorial =
                [...historial]
                    .sort(
                        (a, b) =>
                            new Date(
                                b.FechaInicio
                            ) -
                            new Date(
                                a.FechaInicio
                            )
                    )
                    .map(
                        crearTarjetaHistorial
                    );


            layout.appendChild(
                crearSeccion(
                    "Historial de reuniones",
                    "history-view__section--historial",
                    tarjetasHistorial
                )
            );

        }


        /* =================================================
           INSERTAR
           ================================================= */

        if (
            layout.children.length > 0
        ) {

            list.appendChild(
                layout
            );

        }
        else {

            const empty =
                document.createElement(
                    "p"
                );


            empty.classList.add(
                "historial__empty"
            );


            empty.textContent =
                "Aún no hay reuniones guardadas.";


            list.appendChild(
                empty
            );

        }

    }


    /* =========================================================
       CLICK
       ========================================================= */

    list.addEventListener(
        "click",
        (event) => {

            /* ---------------------------------------------
               ELIMINAR
               --------------------------------------------- */

            const botonEliminar =
                event.target.closest(
                    ".history-card__delete"
                );


            if (
                botonEliminar
            ) {

                event.preventDefault();

                event.stopPropagation();


                const id =
                    Number(
                        botonEliminar.dataset.reunionId
                    );


                if (id) {

                    eliminarReunion(
                        id
                    );

                }


                return;

            }


            /* ---------------------------------------------
               REUNIÓN PROGRAMADA
               --------------------------------------------- */

            const programada =
                event.target.closest(
                    ".history-card--programada"
                );


            if (
                programada
            ) {

                const id =
                    Number(
                        programada.dataset.id
                    );


                if (!id) {

                    return;

                }


                document.dispatchEvent(
                    new CustomEvent(
                        "flow:iniciar-reunion",
                        {
                            detail: {
                                id:
                                    id
                            }
                        }
                    )
                );


                return;

            }


            /* ---------------------------------------------
               HISTORIAL
               --------------------------------------------- */

            const card =
                event.target.closest(
                    ".history-card"
                );


            if (!card) {

                return;

            }


            if (
                card.classList.contains(
                    "history-card--programada"
                )
            ) {

                return;

            }


            const reunionId =
                Number(
                    card.dataset.reunionId
                );


            if (!reunionId) {

                return;

            }


            if (
                typeof onOpen ===
                "function"
            ) {

                onOpen(
                    reunionId
                );

            }

        }
    );


    /* =========================================================
       EVENTOS
       ========================================================= */

    document.addEventListener(
        "flow:reunion-programada",
        () => {

            render();

        }
    );


    document.addEventListener(
        "flow:volver-historial",
        () => {

            render();

        }
    );


    /* =========================================================
       API PÚBLICA
       ========================================================= */

    return {

        render

    };

}