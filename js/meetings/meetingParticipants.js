const API_URL =
    "http://localhost:3000/api";


let reunionUsuarios = [];


/* =========================================================
   INICIALIZAR PARTICIPANTES
   ========================================================= */

export function initMeetingParticipants() {

    const departamento =
        document.querySelector(
            "#reunion-departamento"
        );


    const area =
        document.querySelector(
            "#reunion-area"
        );


    const disponibles =
        document.querySelector(
            "#reunion-usuarios-disponibles"
        );


    const invitados =
        document.querySelector(
            "#reunion-invitados"
        );


    const btnAgregar =
        document.querySelector(
            "#btn-agregar-invitados"
        );


    const btnQuitar =
        document.querySelector(
            "#btn-quitar-invitados"
        );


    if (
        !departamento ||
        !area ||
        !disponibles ||
        !invitados
    ) {

        console.warn(
            "No se encontró el selector de participantes."
        );

        return;
    }


    /* =====================================================
       CARGAR USUARIOS
       ===================================================== */

    cargarUsuarios();


    /* =====================================================
       CAMBIO DE DEPARTAMENTO
       ===================================================== */

    departamento.addEventListener(
        "change",
        () => {

            const departamentoSeleccionado =
                departamento
                    .options[
                        departamento.selectedIndex
                    ]
                    .text;


            cargarAreas(
                departamento.value,
                area
            );


            filtrarUsuarios(
                departamentoSeleccionado,
                ""
            );

        }
    );


    /* =====================================================
       CAMBIO DE ÁREA
       ===================================================== */

    area.addEventListener(
        "change",
        () => {

            const departamentoTexto =
                departamento
                    .options[
                        departamento.selectedIndex
                    ]
                    .text;


            const areaTexto =
                area
                    .options[
                        area.selectedIndex
                    ]
                    .text;


            filtrarUsuarios(
                departamentoTexto,
                areaTexto
            );

        }
    );


    /* =====================================================
       AGREGAR INVITADOS
       ===================================================== */

    btnAgregar.addEventListener(
        "click",
        () => {

            moverUsuarios(
                disponibles,
                invitados
            );

        }
    );


    /* =====================================================
       QUITAR INVITADOS
       ===================================================== */

    btnQuitar.addEventListener(
        "click",
        () => {

            moverUsuarios(
                invitados,
                disponibles
            );

        }
    );


    /* =====================================================
       DOBLE CLICK
       ===================================================== */

    disponibles.addEventListener(
        "dblclick",
        () => {

            moverUsuarios(
                disponibles,
                invitados
            );

        }
    );


    invitados.addEventListener(
        "dblclick",
        () => {

            moverUsuarios(
                invitados,
                disponibles
            );

        }
    );


    /* =====================================================
       FUNCIONES
       ===================================================== */

    async function cargarUsuarios() {

        try {

            const response =
                await fetch(
                    `${API_URL}/usuarios`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.mensaje ||
                    "No fue posible cargar los usuarios."
                );

            }


            reunionUsuarios =
                data.usuarios || [];


        } catch (error) {

            console.error(
                "Error cargando usuarios:",
                error
            );

        }

    }


    async function cargarAreas(
        subsidiaryId,
        selectArea
    ) {

        if (!subsidiaryId) {

            selectArea.innerHTML = `
                <option value="">
                    Seleccione primero un departamento
                </option>
            `;

            selectArea.disabled =
                true;

            return;

        }


        try {

            selectArea.disabled =
                true;


            selectArea.innerHTML = `
                <option value="">
                    Cargando áreas...
                </option>
            `;


            const response =
                await fetch(
                    `${API_URL}/areas?subsidiaryId=${encodeURIComponent(subsidiaryId)}`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.mensaje ||
                    "No fue posible cargar las áreas."
                );

            }


            selectArea.innerHTML = `
                <option value="">
                    Seleccione un área
                </option>
            `;


            (data.datos || []).forEach(
                area => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        area.AreaId;


                    option.textContent =
                        area.AreaName;


                    selectArea.appendChild(
                        option
                    );

                }
            );


            selectArea.disabled =
                !data.datos ||
                data.datos.length === 0;


        } catch (error) {

            console.error(
                "Error cargando áreas:",
                error
            );


            selectArea.innerHTML = `
                <option value="">
                    Error al cargar áreas
                </option>
            `;

            selectArea.disabled =
                true;

        }

    }


    function filtrarUsuarios(
        departamento,
        area
    ) {

        disponibles.innerHTML =
            "";


        /*
         * Si no hay departamento
         */

        if (!departamento) {

            return;

        }


        const usuariosFiltrados =
            reunionUsuarios.filter(
                usuario => {

                    const mismoDepartamento =
                        usuario.departamento
                            .trim()
                            .toLowerCase() ===
                        departamento
                            .trim()
                            .toLowerCase();


                    if (!area) {

                        return mismoDepartamento;

                    }


                    const mismaArea =
                        usuario.area
                            .trim()
                            .toLowerCase() ===
                        area
                            .trim()
                            .toLowerCase();


                    return (
                        mismoDepartamento &&
                        mismaArea
                    );

                }
            );


        /*
         * Evitar mostrar usuarios
         * que ya fueron invitados.
         */

        const invitadosIds =
            Array.from(
                invitados.options
            ).map(
                option =>
                    String(
                        option.value
                    )
            );


        usuariosFiltrados.forEach(
            usuario => {

                if (
                    invitadosIds.includes(
                        String(usuario.id)
                    )
                ) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    usuario.id;


                option.textContent =
                    usuario.nombre;


                disponibles.appendChild(
                    option
                );

            }
        );

    }


    function moverUsuarios(
        origen,
        destino
    ) {

        const seleccionados =
            Array.from(
                origen.selectedOptions
            );


        seleccionados.forEach(
            option => {

                destino.appendChild(
                    option
                );

            }
        );


        /*
         * Deseleccionar
         */

        Array.from(
            destino.options
        ).forEach(
            option => {

                option.selected =
                    false;

            }
        );

    }

}