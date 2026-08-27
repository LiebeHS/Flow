/* =========================================================
   VISTA GLOBAL DE COMPROMISOS
   ========================================================= */

import {
    API_URL
} from "./config.js";

import {
    ESTADO_LABEL,
    PRIORIDAD_LABEL
} from "./commitmentList.js";

import {
    capitalizar
} from "../utils/capitalize.js";


const ESTADOS_ACTIVOS = [
    "pendiente",
    "en-progreso"
];


/* =========================================================
   INICIALIZAR VISTA
   ========================================================= */

export function initCommitmentsView() {

    const list =
        document.querySelector(
            ".commitments-view__list"
        );

    const empty =
        document.querySelector(
            ".commitments-view__empty"
        );

    const filtroUsuario =
        document.querySelector(
            "#compromisos-filtro-usuario"
        );

    const filtroEstado =
        document.querySelector(
            "#compromisos-filtro-estado"
        );


    if (!list) {

        console.warn(
            "No se encontró .commitments-view__list"
        );

        return {

            render:
                async () => {}

        };

    }


    let compromisos =
        [];


    /* =====================================================
       FORMATEAR FECHA
       ===================================================== */

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


        return (
            `${dia}/${mes}/${d.getFullYear()}`
        );

    }


    /* =====================================================
       CARGAR COMPROMISOS DESDE LA API
       ===================================================== */

    async function cargarCompromisos() {

        try {

            const response =
                await fetch(
                    `${API_URL}/compromisos`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.mensaje ||
                    data.error ||
                    "No fue posible obtener los compromisos."
                );

            }


            compromisos =
                data.compromisos ||
                [];

        }
        catch (error) {

            console.error(
                "ERROR OBTENIENDO COMPROMISOS:",
                error
            );

            compromisos =
                [];

        }

    }


    /* =====================================================
       POBLAR FILTRO DE USUARIOS
       ===================================================== */

    function poblarFiltroUsuarios() {

        if (!filtroUsuario) {

            return;

        }


        const valorActual =
            filtroUsuario.value;


        const usuarios =
            [...new Set(
                compromisos.flatMap(
                    c =>
                        c.colaboradores ||
                        []
                )
            )].sort(
                (a, b) =>
                    a.localeCompare(b)
            );


        filtroUsuario.innerHTML = `
            <option value="">
                Todos los usuarios
            </option>
        `;


        usuarios.forEach(
            (nombre) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    nombre;


                option.textContent =
                    nombre;


                filtroUsuario.appendChild(
                    option
                );

            }
        );


        if (
            usuarios.includes(
                valorActual
            )
        ) {

            filtroUsuario.value =
                valorActual;

        }

    }


    /* =====================================================
       CREAR TARJETA
       ===================================================== */

    function crearTarjeta(
        data
    ) {

        const card =
            document.createElement(
                "li"
            );

        card.classList.add(
            "commitment-card"
        );

        card.classList.add(
            `commitment-card--${data.prioridad}`
        );


        const header =
            document.createElement(
                "div"
            );

        header.classList.add(
            "commitment-card__header"
        );


        const title =
            document.createElement(
                "span"
            );

        title.classList.add(
            "commitment-card__title"
        );

        title.textContent =
            data.descripcion;


        const badge =
            document.createElement(
                "span"
            );

        badge.classList.add(
            "commitment-card__badge"
        );

        badge.classList.add(
            `commitment-card__badge--${data.estado}`
        );

        badge.textContent =
            ESTADO_LABEL[data.estado] ||
            data.estado;


        header.append(
            title,
            badge
        );


        const meta =
            document.createElement("div");

        meta.classList.add(
            "commitment-card__meta"
        );

        meta.textContent =
            `${(data.colaboradores || []).join(", ")} · ${data.fechaInicio || "?"} → ${data.fechaLimite || "?"} · ${PRIORIDAD_LABEL[data.prioridad] || data.prioridad}`;


        const origen =
            document.createElement("div");

        origen.classList.add(
            "commitments-view__origin"
        );

        origen.textContent =
            `${data.reunionTitulo || "Reunión Flow"} · ${formatearFecha(data.reunionFecha)}`;


        card.append(
            header,
            meta,
            origen
        );


        return card;

    }


    /* =====================================================
       APLICAR FILTROS Y RENDERIZAR
       ===================================================== */

    function aplicarFiltros() {

        const usuario =
            filtroUsuario ?
                filtroUsuario.value :
                "";

        const estado =
            filtroEstado ?
                filtroEstado.value :
                "activos";


        const filtrados =
            compromisos.filter(
                (item) => {

                    if (
                        usuario &&
                        !(item.colaboradores || []).includes(
                            usuario
                        )
                    ) {

                        return false;

                    }


                    if (
                        estado === "activos"
                    ) {

                        return ESTADOS_ACTIVOS.includes(
                            item.estado
                        );

                    }


                    if (
                        estado === "todos"
                    ) {

                        return true;

                    }


                    return (
                        item.estado === estado
                    );

                }
            );


        list.replaceChildren(
            ...filtrados.map(
                crearTarjeta
            )
        );


        if (empty) {

            empty.hidden =
                filtrados.length > 0;

        }

    }


    /* =====================================================
       RENDER COMPLETO (recarga desde la API)
       ===================================================== */

    async function render() {

        await cargarCompromisos();

        poblarFiltroUsuarios();

        aplicarFiltros();

    }


    /* =====================================================
       EVENTOS DE FILTROS
       ===================================================== */

    if (filtroUsuario) {

        filtroUsuario.addEventListener(
            "change",
            aplicarFiltros
        );

    }


    if (filtroEstado) {

        filtroEstado.addEventListener(
            "change",
            aplicarFiltros
        );

    }


    return {

        render

    };

}
