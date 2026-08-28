const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

const db = require("./db");

db.getConnection()
    .then(connection => {

        console.log("=================================");
        console.log("MYSQL CONECTADO CORRECTAMENTE");
        console.log("Servidor:", process.env.DB_HOST);
        console.log("Base de datos:", process.env.DB_NAME);
        console.log("=================================");

        connection.release();

    })
    .catch(error => {

        console.error("=================================");
        console.error("ERROR DE CONEXIÓN MYSQL");
        console.error(error);
        console.error("=================================");

    });


/* =========================================================
   SERVIDOR
   ========================================================= */

const app =
    express();

const PORT =
    process.env.PORT || 3000;


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(
    cors()
);

app.use(
    express.json()
);


/* =========================================================
   PRUEBA DEL SERVIDOR
   ========================================================= */

app.get(
    "/api",
    (req, res) => {

        res.json({
            ok: true,
            mensaje:
                "Servidor FLOW funcionando correctamente.",
            fecha:
                new Date().toISOString()
        });

    }
);


/* =========================================================
   REGISTRAR USUARIO
   ========================================================= */

app.post(
    "/api/usuarios",
    async (req, res) => {

        try {

            const {
                nombre,
                departamento,
                area,
                correo_electronico,
                password
            } = req.body;


            /* =============================================
               VALIDACIÓN
               ============================================= */

            if (
                !nombre ||
                !departamento ||
                !area ||
                !correo_electronico ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Todos los campos son obligatorios."
                    });

            }


            /* =============================================
               VALIDAR CORREO EXISTENTE
               ============================================= */

            const [existentes] =
                await db.execute(
                    `
                    SELECT
                        id
                    FROM usuarios
                    WHERE correo_electronico = ?
                    LIMIT 1
                    `,
                    [
                        correo_electronico
                    ]
                );


            if (
                existentes.length > 0
            ) {

                return res
                    .status(409)
                    .json({
                        ok: false,
                        mensaje:
                            "Ya existe un usuario con ese correo electrónico."
                    });

            }


            /* =============================================
               ENCRIPTAR CONTRASEÑA
               ============================================= */

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            /* =============================================
               INSERTAR USUARIO
               ============================================= */

            const [resultado] =
                await db.execute(
                    `
                    INSERT INTO usuarios
                    (
                        nombre,
                        departamento,
                        area,
                        correo_electronico,
                        password_hash,
                        activo
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        1
                    )
                    `,
                    [
                        nombre,
                        departamento,
                        area,
                        correo_electronico,
                        passwordHash
                    ]
                );


            /* =============================================
               RESPUESTA
               ============================================= */

            return res
                .status(201)
                .json({

                    ok: true,

                    mensaje:
                        "Usuario registrado correctamente.",

                    usuario: {

                        id:
                            resultado.insertId,

                        nombre,

                        departamento,

                        area,

                        correo_electronico

                    }

                });


        }
        catch (error) {

            console.error(
                "ERROR AL REGISTRAR USUARIO:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "Error interno al registrar el usuario.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   INICIAR SESIÓN
   ========================================================= */

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                correo,
                password
            } = req.body;


            /* =============================================
               VALIDACIÓN
               ============================================= */

            if (
                !correo ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "Correo y contraseña son obligatorios."

                    });

            }


            /* =============================================
               BUSCAR USUARIO
               ============================================= */

            const [usuarios] =
                await db.execute(
                    `
                    SELECT
                        id,
                        nombre,
                        departamento,
                        area,
                        correo_electronico,
                        password_hash,
                        activo
                    FROM usuarios
                    WHERE correo_electronico = ?
                    LIMIT 1
                    `,
                    [
                        correo.trim()
                    ]
                );


            /* =============================================
               USUARIO NO EXISTE
               ============================================= */

            if (
                usuarios.length === 0
            ) {

                return res
                    .status(401)
                    .json({

                        ok: false,

                        mensaje:
                            "Correo o contraseña incorrectos."

                    });

            }


            const usuario =
                usuarios[0];


            /* =============================================
               VALIDAR USUARIO ACTIVO
               ============================================= */

            if (
                Number(
                    usuario.activo
                ) !== 1
            ) {

                return res
                    .status(403)
                    .json({

                        ok: false,

                        mensaje:
                            "El usuario se encuentra inactivo."

                    });

            }


            /* =============================================
               VALIDAR CONTRASEÑA
               ============================================= */

            const passwordCorrecta =
                await bcrypt.compare(
                    password,
                    usuario.password_hash
                );


            if (
                !passwordCorrecta
            ) {

                return res
                    .status(401)
                    .json({

                        ok: false,

                        mensaje:
                            "Correo o contraseña incorrectos."

                    });

            }


            /* =============================================
               RESPUESTA
               ============================================= */

            return res.json({

                ok: true,

                mensaje:
                    "Inicio de sesión correcto.",

                usuario: {

                    id:
                        usuario.id,

                    nombre:
                        usuario.nombre,

                    departamento:
                        usuario.departamento,

                    area:
                        usuario.area,

                    correo_electronico:
                        usuario.correo_electronico,

                    activo:
                        usuario.activo

                }

            });


        }
        catch (error) {

            console.error(
                "ERROR AL INICIAR SESIÓN:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "Error interno al iniciar sesión.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER USUARIOS
   ========================================================= */

app.get(
    "/api/usuarios",
    async (req, res) => {

        try {

            const [usuarios] =
                await db.execute(
                    `
                    SELECT
                        id,
                        nombre,
                        departamento,
                        area,
                        correo_electronico,
                        activo,
                        fecha_registro,
                        fecha_actualizacion
                    FROM usuarios
                    ORDER BY nombre
                    `
                );


            return res.json({

                ok: true,

                usuarios:
                    usuarios

            });


        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER USUARIOS:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener los usuarios.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   EDITAR USUARIO
   ========================================================= */

app.put(
    "/api/usuarios/:id",
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );


            const {
                nombre,
                departamento,
                area,
                correo_electronico,
                password
            } = req.body;


            /* =================================================
               VALIDAR ID
               ================================================= */

            if (!id) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "ID de usuario no válido."
                    });

            }


            /* =================================================
               VALIDAR CAMPOS
               ================================================= */

            if (
                !nombre ||
                !departamento ||
                !area ||
                !correo_electronico
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Nombre, departamento, área y correo son obligatorios."
                    });

            }


            /* =================================================
               VALIDAR CORREO DUPLICADO
               ================================================= */

            const [
                existentes
            ] =
                await db.execute(
                    `
                    SELECT
                        id
                    FROM usuarios
                    WHERE
                        correo_electronico = ?
                        AND id <> ?
                    LIMIT 1
                    `,
                    [
                        correo_electronico,
                        id
                    ]
                );


            if (
                existentes.length > 0
            ) {

                return res
                    .status(409)
                    .json({
                        ok: false,
                        mensaje:
                            "Ya existe otro usuario con ese correo electrónico."
                    });

            }


            /* =================================================
               ACTUALIZAR SIN CAMBIAR CONTRASEÑA
               ================================================= */

            if (
                !password ||
                password.trim() === ""
            ) {

                await db.execute(
                    `
                    UPDATE usuarios
                    SET
                        nombre = ?,
                        departamento = ?,
                        area = ?,
                        correo_electronico = ?,
                        fecha_actualizacion = NOW()
                    WHERE id = ?
                    `,
                    [
                        nombre,
                        departamento,
                        area,
                        correo_electronico,
                        id
                    ]
                );

            }

            else {

                /* =============================================
                   GENERAR NUEVO HASH
                   ============================================= */

                const passwordHash =
                    await bcrypt.hash(
                        password,
                        10
                    );


                /* =============================================
                   ACTUALIZAR CON CONTRASEÑA
                   ============================================= */

                await db.execute(
                    `
                    UPDATE usuarios
                    SET
                        nombre = ?,
                        departamento = ?,
                        area = ?,
                        correo_electronico = ?,
                        password_hash = ?,
                        fecha_actualizacion = NOW()
                    WHERE id = ?
                    `,
                    [
                        nombre,
                        departamento,
                        area,
                        correo_electronico,
                        passwordHash,
                        id
                    ]
                );

            }


            /* =================================================
               RESPUESTA
               ================================================= */

            return res.json({

                ok: true,

                mensaje:
                    "Usuario actualizado correctamente."

            });

        }
        catch (error) {

            console.error(
                "ERROR AL EDITAR USUARIO:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "Error interno al actualizar el usuario.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER DEPARTAMENTOS
   ========================================================= */

app.get(
    "/api/subsidiaries",
    async (req, res) => {

        try {

            const [rows] =
                await db.execute(
                    `
                    SELECT
                        SubsidiaryId,
                        SubsidiaryName
                    FROM subsidiaries
                    ORDER BY SubsidiaryName
                    `
                );


            return res.json({

                ok: true,

                datos:
                    rows

            });


        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER DEPARTAMENTOS:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener los departamentos.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER ÁREAS POR DEPARTAMENTO
   ========================================================= */

app.get(
    "/api/areas",
    async (req, res) => {

        try {

            const subsidiaryId =
                Number(
                    req.query.subsidiaryId
                );


            if (
                !subsidiaryId
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "Debe especificar el departamento."

                    });

            }


            const [rows] =
                await db.execute(
                    `
                    SELECT
                        AreaId,
                        AreaName
                    FROM areas
                    WHERE SubsidiaryId = ?
                    ORDER BY AreaName
                    `,
                    [
                        subsidiaryId
                    ]
                );


            return res.json({

                ok: true,

                datos:
                    rows

            });


        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER ÁREAS:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener las áreas.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   ACTUALIZAR ESTADO DEL USUARIO
   ========================================================= */

app.patch(
    "/api/usuarios/:id/estado",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const activo =
                Number(req.body.activo);


            /* =============================================
               VALIDAR ID
               ============================================= */

            if (
                !id
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de usuario no válido."

                    });

            }


            /* =============================================
               VALIDAR ESTADO
               ============================================= */

            if (
                activo !== 0 &&
                activo !== 1
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "El estado debe ser 0 o 1."

                    });

            }


            /* =============================================
               ACTUALIZAR MYSQL
               ============================================= */

            const [resultado] =
                await db.execute(
                    `
                    UPDATE usuarios
                    SET
                        activo = ?,
                        fecha_actualizacion = NOW()
                    WHERE id = ?
                    `,
                    [
                        activo,
                        id
                    ]
                );


            /* =============================================
               USUARIO NO ENCONTRADO
               ============================================= */

            if (
                resultado.affectedRows === 0
            ) {

                return res
                    .status(404)
                    .json({

                        ok: false,

                        mensaje:
                            "Usuario no encontrado."

                    });

            }


            /* =============================================
               RESPUESTA
               ============================================= */

            return res.json({

                ok: true,

                mensaje:
                    activo === 1
                        ? "Usuario activado correctamente."
                        : "Usuario desactivado correctamente."

            });


        }
        catch (error) {

            console.error(
                "ERROR AL ACTUALIZAR ESTADO DEL USUARIO:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible actualizar el estado del usuario.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   CREAR REUNIÓN
   ========================================================= */

app.post(
    "/api/reuniones",
    async (req, res) => {

        try {

            const {
                titulo,
                descripcion,
                fechaInicio,
                fechaFin,
                lugar,
                estado,
                usuarioCreadorId
            } = req.body;

            console.log(
    "POST /api/reuniones BODY:",
    req.body
);

console.log(
    "usuarioCreadorId:",
    usuarioCreadorId,
    "tipo:",
    typeof usuarioCreadorId
);


            /* =================================================
               VALIDACIONES
               ================================================= */

            if (!usuarioCreadorId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "No se recibió el usuario creador."

                    });

            }


            if (!fechaInicio) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "La fecha de inicio es obligatoria."

                    });

            }


            /* =================================================
               INSERTAR REUNIÓN
               ================================================= */

            const [
                resultado
            ] =
                await db.execute(
                    `
                    INSERT INTO reuniones
                    (
                        Titulo,
                        Descripcion,
                        FechaInicio,
                        FechaFin,
                        Lugar,
                        Estado,
                        UsuarioCreadorId
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [

                        titulo ||
                            "Reunión Flow",

                        descripcion ||
                            null,

                        fechaInicio,

                        fechaFin ||
                            null,

                        lugar ||
                            null,

                        estado ||
                            "Programada",

                        Number(
                            usuarioCreadorId
                        )

                    ]
                );


            /* =================================================
               RESPUESTA
               ================================================= */

            return res
                .status(201)
                .json({

                    ok: true,

                    ReunionId:
                        resultado.insertId,

                    mensaje:
                        "Reunión creada correctamente."

                });

        }
        catch (error) {

            console.error(
                "ERROR AL CREAR REUNIÓN:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible crear la reunión.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER REUNIONES PROGRAMADAS
   ========================================================= */

app.get(
    "/api/reuniones/programadas",
    async (req, res) => {

        try {

            const [
                reuniones
            ] =
                await db.execute(
                    `
                    SELECT
                        r.ReunionId,
                        r.Titulo,
                        r.Descripcion,
                        r.FechaInicio,
                        r.FechaFin,
                        r.Lugar,
                        r.Estado,
                        r.UsuarioCreadorId,
                        r.FechaRegistro,

                        COUNT(
                            rp.ReunionParticipanteId
                        ) AS TotalParticipantes

                    FROM reuniones r

                    LEFT JOIN reunion_participantes rp
                        ON rp.ReunionId =
                           r.ReunionId

                    WHERE
                        r.Estado IN ('Programada', 'En curso')

                    GROUP BY
                        r.ReunionId,
                        r.Titulo,
                        r.Descripcion,
                        r.FechaInicio,
                        r.FechaFin,
                        r.Lugar,
                        r.Estado,
                        r.UsuarioCreadorId,
                        r.FechaRegistro

                    ORDER BY
                        r.FechaInicio ASC
                    `
                );


            return res.json({

                ok: true,

                reuniones:
                    reuniones

            });

        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER REUNIONES PROGRAMADAS:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener las reuniones programadas.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER TODOS LOS COMPROMISOS
   ========================================================= */

const STATUS_A_ESTADO = {

    1: "pendiente",
    2: "en-progreso",
    3: "completado",
    4: "vencido"

};


app.get(
    "/api/compromisos",
    async (req, res) => {

        try {

            const [rows] =
                await db.execute(
                    `
                    SELECT
                        c.CompromisoId,
                        c.Titulo,
                        c.Descripcion,
                        c.Prioridad,
                        c.FechaInicioEstimada,
                        c.FechaFinEstimada,
                        c.Status,
                        c.ReunionId,
                        r.Titulo AS ReunionTitulo,
                        r.FechaInicio AS ReunionFecha,
                        u.nombre AS ResponsableNombre,
                        CASE
                            WHEN c.Status IN (1, 2)
                                AND c.FechaFinEstimada IS NOT NULL
                                AND c.FechaFinEstimada < NOW()
                            THEN 4
                            ELSE c.Status
                        END AS StatusEfectivo
                    FROM compromisos c
                    INNER JOIN reuniones r
                        ON r.ReunionId = c.ReunionId
                    INNER JOIN usuarios u
                        ON u.id = c.UsuarioAsignadoId
                    WHERE
                        r.Estado <> 'Cancelada'
                    ORDER BY
                        c.FechaFinEstimada ASC
                    `
                );


            const compromisos =
                rows.map(
                    row => ({

                        id:
                            row.CompromisoId,

                        descripcion:
                            row.Descripcion ||
                            row.Titulo,

                        usuarioAsignadoNombre:
                            row.ResponsableNombre,

                        fechaInicio:
                            row.FechaInicioEstimada,

                        fechaLimite:
                            row.FechaFinEstimada,

                        estado:
                            STATUS_A_ESTADO[row.StatusEfectivo] ||
                            "pendiente",

                        estadoReal:
                            STATUS_A_ESTADO[row.Status] ||
                            "pendiente",

                        prioridad:
                            row.Prioridad,

                        reunionId:
                            row.ReunionId,

                        reunionTitulo:
                            row.ReunionTitulo,

                        reunionFecha:
                            row.ReunionFecha

                    })
                );


            return res.json({

                ok: true,

                compromisos:
                    compromisos

            });

        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER COMPROMISOS:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener los compromisos.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   ACTUALIZAR ESTADO / FECHA LÍMITE DE UN COMPROMISO
   ========================================================= */

/*
 * Desde la vista global de compromisos solo se pueden editar
 * estos dos campos. El resto (responsable, descripción, fecha
 * de inicio, prioridad) se define al crear el compromiso
 * dentro de la reunión y no se modifica aquí.
 */

app.patch(
    "/api/compromisos/:id",
    async (req, res) => {

        try {

            const compromisoId =
                Number(
                    req.params.id
                );


            if (!compromisoId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de compromiso no válido."

                    });

            }


            const estado =
                String(
                    req.body.estado ||
                    ""
                ).trim();


            const fechaLimite =
                req.body.fechaLimite ||
                null;


            if (
                !ESTADO_A_STATUS[estado]
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "Estado de compromiso no válido."

                    });

            }


            const [resultado] =
                await db.execute(
                    `
                    UPDATE compromisos
                    SET
                        Status = ?,
                        FechaFinEstimada = ?,
                        FechaActualizacion = NOW()
                    WHERE CompromisoId = ?
                    `,
                    [
                        ESTADO_A_STATUS[estado],
                        fechaLimite,
                        compromisoId
                    ]
                );


            if (
                resultado.affectedRows === 0
            ) {

                return res
                    .status(404)
                    .json({

                        ok: false,

                        mensaje:
                            "Compromiso no encontrado."

                    });

            }


            return res.json({

                ok: true,

                mensaje:
                    "Compromiso actualizado correctamente."

            });

        }
        catch (error) {

            console.error(
                "ERROR AL ACTUALIZAR COMPROMISO:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible actualizar el compromiso.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER SECCIONES DE UNA REUNIÓN
   ========================================================= */

app.get(
    "/api/reuniones/:id/secciones",
    async (req, res) => {

        try {

            const reunionId =
                Number(
                    req.params.id
                );


            if (!reunionId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de reunión no válido."

                    });

            }


            const [rows] =
                await db.execute(
                    `
                    SELECT
                        ReunionSeccionId,
                        ReunionId,
                        Seccion,
                        Contenido,
                        FechaRegistro,
                        FechaActualizacion
                    FROM reunion_secciones
                    WHERE ReunionId = ?
                    ORDER BY Seccion
                    `,
                    [
                        reunionId
                    ]
                );


            const secciones =
                rows.map(
                    row => {

                        let contenido =
                            row.Contenido;


                        if (
                            typeof contenido ===
                            "string"
                        ) {

                            try {

                                contenido =
                                    JSON.parse(
                                        contenido
                                    );

                            }
                            catch (error) {

                                console.error(
                                    "ERROR PARSEANDO CONTENIDO:",
                                    error
                                );

                            }

                        }


                        return {

                            ReunionSeccionId:
                                row.ReunionSeccionId,

                            ReunionId:
                                row.ReunionId,

                            Seccion:
                                row.Seccion,

                            Contenido:
                                contenido

                        };

                    }
                );


            return res.json({

                ok: true,

                secciones:
                    secciones

            });

        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER SECCIONES:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener las secciones.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   GUARDAR / ACTUALIZAR SECCIÓN
   ========================================================= */

app.put(
    "/api/reuniones/:id/secciones/:seccion",
    async (req, res) => {

        try {

            const reunionId =
                Number(
                    req.params.id
                );


            const seccion =
                String(
                    req.params.seccion ||
                    ""
                ).trim();


            const contenido =
                req.body.contenido;


            if (!reunionId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de reunión no válido."

                    });

            }


            if (!seccion) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "La sección es obligatoria."

                    });

            }


            if (
                contenido ===
                undefined
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "El contenido es obligatorio."

                    });

            }


            if (
                !/^[a-zA-Z0-9_-]{1,50}$/
                    .test(seccion)
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "Nombre de sección no válido."

                    });

            }


            const contenidoJSON =
                JSON.stringify(
                    contenido
                );


            await db.execute(
                `
                INSERT INTO reunion_secciones
                (
                    ReunionId,
                    Seccion,
                    Contenido
                )
                VALUES
                (
                    ?,
                    ?,
                    ?
                )
                ON DUPLICATE KEY UPDATE
                    Contenido = VALUES(Contenido),
                    FechaActualizacion =
                        CURRENT_TIMESTAMP
                `,
                [
                    reunionId,
                    seccion,
                    contenidoJSON
                ]
            );


            /*
             * Deja rastro en la reunión de que algo se
             * modificó (relevante sobre todo para reuniones
             * ya finalizadas que siguen editables ese día).
             */

            await db.execute(
                `
                UPDATE reuniones
                SET FechaActualizacion = NOW()
                WHERE ReunionId = ?
                `,
                [
                    reunionId
                ]
            );


            return res.json({

                ok: true,

                mensaje:
                    "Sección guardada correctamente."

            });

        }
        catch (error) {

            console.error(
                "ERROR AL GUARDAR SECCIÓN:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible guardar la sección.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER HISTORIAL DE REUNIONES
   ========================================================= */

app.get(
    "/api/reuniones/historial",
    async (req, res) => {

        try {

            const [
                reuniones
            ] =
                await db.execute(
                    `
                    SELECT
                        r.ReunionId,
                        r.Titulo,
                        r.Descripcion,
                        r.FechaInicio,
                        r.FechaFin,
                        r.Lugar,
                        r.Estado,
                        r.UsuarioCreadorId,
                        r.FechaRegistro,
                        r.FechaActualizacion,

                        COUNT(
                            DISTINCT rp.ReunionParticipanteId
                        ) AS TotalParticipantes,

                        COALESCE(
                            JSON_LENGTH(
                                (
                                    SELECT
                                        rs.Contenido
                                    FROM reunion_secciones rs
                                    WHERE
                                        rs.ReunionId =
                                            r.ReunionId
                                        AND rs.Seccion =
                                            'objetivos'
                                    LIMIT 1
                                )
                            ),
                            0
                        ) AS TotalObjetivos,

                        COALESCE(
                            JSON_LENGTH(
                                (
                                    SELECT
                                        rs.Contenido
                                    FROM reunion_secciones rs
                                    WHERE
                                        rs.ReunionId =
                                            r.ReunionId
                                        AND rs.Seccion =
                                            'compromisos'
                                    LIMIT 1
                                )
                            ),
                            0
                        ) AS TotalCompromisos

                    FROM reuniones r

                    LEFT JOIN reunion_participantes rp
                        ON rp.ReunionId =
                           r.ReunionId

                    WHERE
                        r.Estado IN (
                            'Finalizada',
                            'Cancelada'
                        )

                    GROUP BY
                        r.ReunionId,
                        r.Titulo,
                        r.Descripcion,
                        r.FechaInicio,
                        r.FechaFin,
                        r.Lugar,
                        r.Estado,
                        r.UsuarioCreadorId,
                        r.FechaRegistro,
                        r.FechaActualizacion

                    ORDER BY
                        r.FechaInicio DESC
                    `
                );


            return res.json({

                ok: true,

                reuniones:
                    reuniones

            });

        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER HISTORIAL:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener el historial de reuniones.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   OBTENER REUNIÓN POR ID
   ========================================================= */

app.get(
    "/api/reuniones/:id",
    async (req, res) => {

        try {

            const reunionId =
                Number(
                    req.params.id
                );


            if (!reunionId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de reunión no válido."

                    });

            }


            /* =================================================
               REUNIÓN
               ================================================= */

            const [
                reuniones
            ] =
                await db.execute(
                    `
                    SELECT
                        ReunionId,
                        Titulo,
                        Descripcion,
                        FechaInicio,
                        FechaFin,
                        Lugar,
                        Estado,
                        FechaFinalizacion,
                        UsuarioCreadorId
                    FROM reuniones
                    WHERE ReunionId = ?
                    LIMIT 1
                    `,
                    [
                        reunionId
                    ]
                );


            if (
                reuniones.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        ok: false,

                        mensaje:
                            "Reunión no encontrada."

                    });

            }


            /* =================================================
               PARTICIPANTES
               ================================================= */

            const [
                participantes
            ] =
                await db.execute(
                    `
                    SELECT
                        rp.UsuarioId,
                        rp.Asistio,
                        u.nombre,
                        u.correo_electronico
                    FROM reunion_participantes rp

                    INNER JOIN usuarios u
                        ON u.id =
                           rp.UsuarioId

                    WHERE
                        rp.ReunionId = ?

                    ORDER BY
                        u.nombre
                    `,
                    [
                        reunionId
                    ]
                );


            return res.json({

                ok: true,

                reunion:
                    reuniones[0],

                participantes:
                    participantes

            });

        }
        catch (error) {

            console.error(
                "ERROR AL OBTENER REUNIÓN:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible obtener la reunión.",

                    error:
                        error.message

                });

        }

    }
);


/* =========================================================
   MIGRAR COMPROMISOS A LA TABLA COMPROMISOS
   ========================================================= */

/*
 * Se ejecuta al finalizar una reunión. Los compromisos viven,
 * mientras la reunión está activa, como JSON dentro de
 * reunion_secciones (Seccion='compromisos'). Al terminar, se
 * archivan como filas reales en la tabla `compromisos`.
 *
 * "Vencido" NO es un valor guardado en Status: se calcula al
 * consultar (ver GET /api/compromisos), comparando la fecha
 * límite contra la fecha actual.
 */

const ESTADO_A_STATUS = {

    "pendiente": 1,
    "en-progreso": 2,
    "completado": 3

};


async function resolverDepartamentoArea(
    connection,
    usuarioAsignadoId
) {

    const [rows] =
        await connection.execute(
            `
            SELECT
                s.SubsidiaryId,
                a.AreaId
            FROM usuarios u
            LEFT JOIN subsidiaries s
                ON s.SubsidiaryName = u.departamento
            LEFT JOIN areas a
                ON a.AreaName = u.area
                AND a.SubsidiaryId = s.SubsidiaryId
            WHERE u.id = ?
            LIMIT 1
            `,
            [
                usuarioAsignadoId
            ]
        );


    if (
        rows.length === 0 ||
        !rows[0].SubsidiaryId ||
        !rows[0].AreaId
    ) {

        return null;

    }


    return {

        departamentoId:
            rows[0].SubsidiaryId,

        areaId:
            rows[0].AreaId

    };

}


async function insertarCompromiso(
    connection,
    reunionId,
    compromiso
) {

    const usuarioAsignadoId =
        Number(
            compromiso.usuarioAsignadoId
        );


    if (!usuarioAsignadoId) {

        console.warn(
            `Compromiso sin usuarioAsignadoId válido en reunión ${reunionId}, se omite:`,
            compromiso
        );

        return false;

    }


    const deptoArea =
        await resolverDepartamentoArea(
            connection,
            usuarioAsignadoId
        );


    if (!deptoArea) {

        console.warn(
            `No fue posible resolver departamento/área para el usuario ${usuarioAsignadoId} (reunión ${reunionId}), se omite el compromiso.`
        );

        return false;

    }


    const descripcion =
        String(
            compromiso.descripcion ||
            ""
        ).trim();


    const status =
        ESTADO_A_STATUS[compromiso.estado] ||
        1;


    await connection.execute(
        `
        INSERT INTO compromisos
        (
            ReunionId,
            Titulo,
            Descripcion,
            UsuarioAsignadoId,
            DepartamentoId,
            AreaId,
            Prioridad,
            FechaInicioEstimada,
            FechaFinEstimada,
            Status
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
        [
            reunionId,
            descripcion.slice(0, 250) || "Compromiso",
            descripcion || null,
            usuarioAsignadoId,
            deptoArea.departamentoId,
            deptoArea.areaId,
            compromiso.prioridad || "media",
            compromiso.fechaInicio || null,
            compromiso.fechaLimite || null,
            status
        ]
    );


    return true;

}


async function resincronizarCompromisos(
    connection,
    reunionId,
    compromisos
) {

    await connection.execute(
        `
        DELETE FROM compromisos
        WHERE ReunionId = ?
        `,
        [
            reunionId
        ]
    );


    for (const compromiso of compromisos) {

        await insertarCompromiso(
            connection,
            reunionId,
            compromiso
        );

    }

}


async function migrarCompromisosATabla(
    connection,
    reunionId
) {

    const [seccionRows] =
        await connection.execute(
            `
            SELECT Contenido
            FROM reunion_secciones
            WHERE
                ReunionId = ?
                AND Seccion = 'compromisos'
            LIMIT 1
            `,
            [
                reunionId
            ]
        );


    if (seccionRows.length === 0) {

        return;

    }


    let contenido =
        seccionRows[0].Contenido;


    if (typeof contenido === "string") {

        try {

            contenido =
                JSON.parse(
                    contenido
                );

        }
        catch (error) {

            console.error(
                "ERROR PARSEANDO COMPROMISOS AL FINALIZAR:",
                error
            );

            contenido = [];

        }

    }


    if (!Array.isArray(contenido)) {

        return;

    }


    for (const compromiso of contenido) {

        await insertarCompromiso(
            connection,
            reunionId,
            compromiso
        );

    }

}


/* =========================================================
   ACTUALIZAR ESTADO DE REUNIÓN
   ========================================================= */

app.patch(
    "/api/reuniones/:id/estado",
    async (req, res) => {

        let connection;

        try {

            const reunionId =
                Number(
                    req.params.id
                );


            const estado =
                String(
                    req.body.estado ||
                    ""
                ).trim();


            const estadosPermitidos = [

                "Programada",
                "En curso",
                "Finalizada",
                "Cancelada"

            ];


            if (!reunionId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de reunión no válido."

                    });

            }


            if (
                !estadosPermitidos.includes(
                    estado
                )
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "Estado de reunión no válido."

                    });

            }


            if (
                estado === "Finalizada"
            ) {

                connection =
                    await db.getConnection();


                await connection.beginTransaction();


                await migrarCompromisosATabla(
                    connection,
                    reunionId
                );


                await connection.execute(
                    `
                    UPDATE reuniones
                    SET
                        Estado = ?,
                        FechaFinalizacion = COALESCE(FechaFinalizacion, NOW()),
                        FechaActualizacion = NOW()
                    WHERE ReunionId = ?
                    `,
                    [
                        estado,
                        reunionId
                    ]
                );


                await connection.commit();

            }
            else {

                await db.execute(
                    `
                    UPDATE reuniones
                    SET
                        Estado = ?,
                        FechaActualizacion = NOW()
                    WHERE ReunionId = ?
                    `,
                    [
                        estado,
                        reunionId
                    ]
                );

            }


            return res.json({

                ok: true,

                mensaje:
                    "Estado de reunión actualizado correctamente."

            });

        }
        catch (error) {

            if (connection) {

                await connection.rollback();

            }


            console.error(
                "ERROR AL ACTUALIZAR ESTADO DE REUNIÓN:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible actualizar el estado.",

                    error:
                        error.message

                });

        }
        finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


/* =========================================================
   RESINCRONIZAR COMPROMISOS DE UNA REUNIÓN FINALIZADA
   ========================================================= */

/*
 * Solo aplica mientras la reunión sigue dentro de su ventana
 * de edición (terminada el mismo día calendario). Se usa desde
 * la vista de Archivo cuando esta editable: cada guardado de
 * compromisos vuelve a reflejar el arreglo completo en la
 * tabla `compromisos` (se borra y reinserta, ver
 * resincronizarCompromisos).
 */

app.put(
    "/api/reuniones/:id/compromisos",
    async (req, res) => {

        let connection;

        try {

            const reunionId =
                Number(
                    req.params.id
                );


            if (!reunionId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de reunión no válido."

                    });

            }


            const compromisos =
                Array.isArray(
                    req.body.compromisos
                )
                    ? req.body.compromisos
                    : [];


            const [reuniones] =
                await db.execute(
                    `
                    SELECT
                        Estado,
                        FechaFinalizacion
                    FROM reuniones
                    WHERE ReunionId = ?
                    LIMIT 1
                    `,
                    [
                        reunionId
                    ]
                );


            if (reuniones.length === 0) {

                return res
                    .status(404)
                    .json({

                        ok: false,

                        mensaje:
                            "Reunión no encontrada."

                    });

            }


            const reunion =
                reuniones[0];


            const finalizadaHoy =
                reunion.Estado === "Finalizada" &&
                reunion.FechaFinalizacion &&
                new Date(reunion.FechaFinalizacion).toDateString() ===
                    new Date().toDateString();


            if (!finalizadaHoy) {

                return res
                    .status(403)
                    .json({

                        ok: false,

                        mensaje:
                            "La ventana de edición para esta reunión ya cerró."

                    });

            }


            connection =
                await db.getConnection();


            await connection.beginTransaction();


            await resincronizarCompromisos(
                connection,
                reunionId,
                compromisos
            );


            await connection.commit();


            return res.json({

                ok: true,

                mensaje:
                    "Compromisos actualizados correctamente."

            });

        }
        catch (error) {

            if (connection) {

                await connection.rollback();

            }


            console.error(
                "ERROR AL RESINCRONIZAR COMPROMISOS:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible actualizar los compromisos.",

                    error:
                        error.message

                });

        }
        finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


/* =========================================================
   GUARDAR PARTICIPANTES DE UNA REUNIÓN
   ========================================================= */

app.post(
    "/api/reuniones/:id/participantes",
    async (req, res) => {

        let connection;

        try {

            const reunionId =
                Number(
                    req.params.id
                );


            const usuarios =
                Array.isArray(
                    req.body.usuarios
                )
                    ? req.body.usuarios
                    : [];


            /* =============================================
               VALIDAR REUNIÓN
               ============================================= */

            if (!reunionId) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "ID de reunión no válido."

                    });

            }


            /* =============================================
               VALIDAR PARTICIPANTES
               ============================================= */

            if (
                usuarios.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        ok: false,

                        mensaje:
                            "No se recibieron participantes."

                    });

            }


            connection =
                await db.getConnection();


            await connection.beginTransaction();


            /* =============================================
               INSERTAR PARTICIPANTES
               ============================================= */

            for (
                const usuarioId of usuarios
            ) {

                const idUsuario =
                    Number(
                        usuarioId
                    );


                if (!idUsuario) {

                    continue;

                }


                await connection.execute(
                    `
                    INSERT INTO reunion_participantes
                    (
                        ReunionId,
                        UsuarioId,
                        Asistio
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        0
                    )
                    ON DUPLICATE KEY UPDATE
                        Asistio = Asistio
                    `,
                    [
                        reunionId,
                        idUsuario
                    ]
                );

            }


            await connection.commit();


            return res
                .status(201)
                .json({

                    ok: true,

                    mensaje:
                        "Participantes guardados correctamente."

                });

        }
        catch (error) {

            if (connection) {

                await connection.rollback();

            }


            console.error(
                "ERROR AL GUARDAR PARTICIPANTES:",
                error
            );


            return res
                .status(500)
                .json({

                    ok: false,

                    mensaje:
                        "No fue posible guardar los participantes.",

                    error:
                        error.message

                });

        }
        finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


/* =========================================================
   RUTA NO ENCONTRADA
   ========================================================= */

app.use(
    (req, res) => {

        res
            .status(404)
            .json({

                ok: false,

                mensaje:
                    "Ruta API no encontrada.",

                ruta:
                    req.originalUrl,

                metodo:
                    req.method

            });

    }
);


/* =========================================================
   INICIAR SERVIDOR
   ========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "===================================="
        );

        console.log(
            " FLOW - SERVIDOR"
        );

        console.log(
            "===================================="
        );

        console.log(
            `Servidor escuchando en el puerto ${PORT}`
        );

        console.log(
            `API local: http://localhost:${PORT}/api`
        );

        console.log(
            "===================================="
        );

    }
);