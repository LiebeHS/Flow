/* =========================================================
   ARCHIVE VIEW
   ========================================================= */

import {
    showView
} from "../services/viewManager.js";

import {
    API_URL
} from "./config.js";


/* =========================================================
   ETIQUETAS DE ESTADO
   ========================================================= */

const ESTADO_LABEL = {

    pendiente:
        "Pendiente",

    "en-progreso":
        "En progreso",

    completado:
        "Completado"

};


/* =========================================================
   CREAR VISTA DE ARCHIVO
   ========================================================= */

export function createArchiveView() {

    const content =
        document.querySelector(
            "#archive-content"
        );


    const backBtn =
        document.querySelector(
            "#archive-back"
        );


    /* =====================================================
       VALIDAR ELEMENTOS
       ===================================================== */

    if (!content) {

        console.error(
            "No se encontró #archive-content"
        );

    }


    if (!backBtn) {

        console.error(
            "No se encontró #archive-back"
        );

    }


    /* =========================================================
       TÍTULO
       ========================================================= */

    function titulo(
        texto
    ) {

        const h =
            document.createElement(
                "h2"
            );


        h.classList.add(
            "archive__section-title"
        );


        h.textContent =
            texto;


        return h;

    }


    /* =========================================================
       PÁRRAFO
       ========================================================= */

    function parrafo(
        texto
    ) {

        const p =
            document.createElement(
                "p"
            );


        p.classList.add(
            "archive__text"
        );


        p.textContent =
            texto ||
            "—";


        return p;

    }


    /* =========================================================
       LISTA SIMPLE
       ========================================================= */

    function listaSimple(
        items,
        formato
    ) {

        const ul =
            document.createElement(
                "ul"
            );


        ul.classList.add(
            "archive__list"
        );


        if (
            !Array.isArray(
                items
            ) ||
            items.length === 0
        ) {

            ul.appendChild(
                parrafo(
                    "Sin registros."
                )
            );


            return ul;

        }


        items.forEach(
            item => {

                const li =
                    document.createElement(
                        "li"
                    );


                li.textContent =
                    formato(
                        item
                    );


                ul.appendChild(
                    li
                );

            }
        );


        return ul;

    }


    /* =========================================================
       PINTAR DESARROLLO
       ========================================================= */

    function pintarDesarrollo(
        desarrollo,
        objetivos
    ) {

        const cont =
            document.createElement(
                "div"
            );


        desarrollo =
            desarrollo ||
            {};


        objetivos =
            Array.isArray(
                objetivos
            )
                ? objetivos
                : [];


        for (
            const objetivoId in desarrollo
        ) {

            const bloques =
                desarrollo[
                    objetivoId
                ];


            if (
                !Array.isArray(
                    bloques
                )
            ) {

                continue;

            }


            const obj =
                objetivos.find(
                    objetivo =>
                        String(
                            objetivo.id
                        ) ===
                        String(
                            objetivoId
                        )
                );


            if (
                obj
            ) {

                cont.appendChild(
                    titulo(
                        obj.texto
                    )
                );

            }


            bloques.forEach(
                bloque => {

                    if (
                        bloque.tipo ===
                        "subtitulo"
                    ) {

                        const s =
                            document.createElement(
                                "h4"
                            );


                        s.textContent =
                            bloque.texto;


                        cont.appendChild(
                            s
                        );

                    }

                    else if (
                        bloque.tipo ===
                        "punto"
                    ) {

                        const p =
                            document.createElement(
                                "p"
                            );


                        p.textContent =
                            `• ${
                                bloque.texto ||
                                ""
                            } (${
                                bloque.avance ??
                                0
                            }%)`;


                        cont.appendChild(
                            p
                        );

                    }

                    else {

                        cont.appendChild(
                            parrafo(
                                bloque.texto
                            )
                        );

                    }

                }
            );

        }


        /*
         * Si no existe desarrollo,
         * mostrar mensaje.
         */

        if (
            cont.children.length ===
            0
        ) {

            cont.appendChild(
                parrafo(
                    "Sin registros."
                )
            );

        }


        return cont;

    }


    /* =========================================================
       OBTENER REUNIÓN
       ========================================================= */

    async function obtenerReunion(
        reunionId
    ) {

        const response =
            await fetch(
                `${API_URL}/reuniones/${reunionId}`
            );


        const data =
            await response.json();


        if (
            !response.ok
        ) {

            throw new Error(
                data.mensaje ||
                data.error ||
                "No fue posible obtener la reunión."
            );

        }


        return data;

    }


    /* =========================================================
       OBTENER SECCIONES
       ========================================================= */

    async function obtenerSecciones(
        reunionId
    ) {

        const response =
            await fetch(
                `${API_URL}/reuniones/${reunionId}/secciones`
            );


        const data =
            await response.json();


        if (
            !response.ok
        ) {

            throw new Error(
                data.mensaje ||
                data.error ||
                "No fue posible obtener las secciones."
            );

        }


        return data.secciones ||
            [];

    }


    /* =========================================================
       CONVERTIR SECCIONES A OBJETO
       ========================================================= */

    function construirSecciones(
        secciones
    ) {

        const resultado = {};


        (
            secciones ||
            []
        ).forEach(
            seccion => {

                resultado[
                    seccion.Seccion
                ] =
                    seccion.Contenido;

            }
        );


        return resultado;

    }


    /* =========================================================
       RENDER
       ========================================================= */

    async function render(
        reunionId
    ) {

        try {

            /* =============================================
               VALIDAR ID
               ============================================= */

            const id =
                Number(
                    reunionId
                );


            if (!id) {

                console.error(
                    "ReunionId inválido:",
                    reunionId
                );


                return;

            }


            console.log(
                "ABRIENDO REUNIÓN DESDE MYSQL:",
                id
            );


            /* =============================================
               CARGAR DATOS
               ============================================= */

            const [
                reunionData,
                secciones
            ] =
                await Promise.all(
                    [

                        obtenerReunion(
                            id
                        ),

                        obtenerSecciones(
                            id
                        )

                    ]
                );


            const reunion =
                reunionData.reunion ||
                {};


            const s =
                construirSecciones(
                    secciones
                );


            console.log(
                "REUNIÓN:",
                reunion
            );


            console.log(
                "SECCIONES:",
                s
            );


            /* =============================================
               LIMPIAR VISTA
               ============================================= */

            content.replaceChildren();


            /* =============================================
               INFORMACIÓN GENERAL
               ============================================= */

            content.appendChild(
                titulo(
                    reunion.Titulo ||
                    "Reunión"
                )
            );


            if (
                reunion.Descripcion
            ) {

                content.appendChild(
                    parrafo(
                        reunion.Descripcion
                    )
                );

            }


            /* =============================================
               OBJETIVOS
               ============================================= */

            content.appendChild(
                titulo(
                    "Objetivos"
                )
            );


            content.appendChild(
                listaSimple(
                    s.objetivos ||
                    [],
                    objetivo =>
                        `${
                            objetivo.done
                                ? "✓"
                                : "○"
                        } ${
                            objetivo.texto ||
                            ""
                        }`
                )
            );


            /* =============================================
               ASUNTOS GENERALES
               ============================================= */

            content.appendChild(
                titulo(
                    "Asuntos generales"
                )
            );


            content.appendChild(
                listaSimple(
                    s.asuntos ||
                    [],
                    asunto =>
                        `${
                            asunto.done
                                ? "✓"
                                : "○"
                        } ${
                            asunto.texto ||
                            ""
                        }`
                )
            );


            /* =============================================
               DESARROLLO
               ============================================= */

            content.appendChild(
                titulo(
                    "Desarrollo"
                )
            );


            content.appendChild(
                pintarDesarrollo(
                    s.desarrollo ||
                    {},
                    s.objetivos ||
                    []
                )
            );


            /* =============================================
               COMPROMISOS
               ============================================= */

            content.appendChild(
                titulo(
                    "Compromisos"
                )
            );


            content.appendChild(
                listaSimple(
                    s.compromisos ||
                    [],
                    compromiso => {

                        const colaboradores =
                            Array.isArray(
                                compromiso.colaboradores
                            )
                                ? compromiso.colaboradores.join(
                                    ", "
                                )
                                : (
                                    compromiso.colaboradores ||
                                    ""
                                );


                        const estado =
                            ESTADO_LABEL[
                                compromiso.estado
                            ] ||
                            compromiso.estado ||
                            "—";


                        return (
                            `${colaboradores}` +
                            `${
                                colaboradores
                                    ? " — "
                                    : ""
                            }` +
                            `${compromiso.descripcion || ""}` +
                            ` [${
                                estado
                            }]`
                        );

                    }
                )
            );


            /* =============================================
               OTROS ASUNTOS
               ============================================= */

            content.appendChild(
                titulo(
                    "Otros asuntos"
                )
            );


            content.appendChild(
                parrafo(
                    s.otros
                )
            );


            /* =============================================
               COMPETITIVIDAD
               ============================================= */

            content.appendChild(
                titulo(
                    "Competitividad"
                )
            );


            content.appendChild(
                parrafo(
                    s.competitividad
                )
            );


            /* =============================================
               ACUERDOS
               ============================================= */

            content.appendChild(
                titulo(
                    "Acuerdos"
                )
            );


            content.appendChild(
                parrafo(
                    s.acuerdos
                )
            );


            /* =============================================
               ENLACES
               ============================================= */

            content.appendChild(
                titulo(
                    "Enlaces"
                )
            );


            content.appendChild(
                listaSimple(
                    s.enlaces ||
                    [],
                    enlace =>
                        `${enlace.titulo || ""}: ${
                            enlace.url || ""
                        }`
                )
            );


            /* =============================================
               REFLEXIÓN
               ============================================= */

            content.appendChild(
                titulo(
                    "Reflexión grupal"
                )
            );


            content.appendChild(
                parrafo(
                    s.reflexion
                )
            );


            /* =============================================
               MOSTRAR VISTA
               ============================================= */

            showView(
                "archivo"
            );

        }
        catch (error) {

            console.error(
                "ERROR AL ABRIR REUNIÓN ARCHIVADA:",
                error
            );


            content.replaceChildren();


            content.appendChild(
                parrafo(
                    error.message ||
                    "No fue posible cargar la reunión."
                )
            );


            showView(
                "archivo"
            );

        }

    }


    /* =========================================================
       VOLVER AL HISTORIAL
       ========================================================= */

    if (
        backBtn
    ) {

        backBtn.addEventListener(
            "click",
            () => {

                showView(
                    "historial"
                );

            }
        );

    }


    /* =========================================================
       API PÚBLICA
       ========================================================= */

    return {

        render

    };

}