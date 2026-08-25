/* =========================================================
   AUTENTICACIÓN FLOW
   ========================================================= */

const USER_KEY = "flow.usuario";


/* =========================================================
   OBTENER USUARIO ACTUAL
   ========================================================= */

export function getUsuarioActual() {

    const usuario =
        sessionStorage.getItem(USER_KEY);

    if (!usuario) {
        return null;
    }

    try {

        return JSON.parse(usuario);

    }
    catch (error) {

        console.error(
            "Error al leer la sesión:",
            error
        );

        sessionStorage.removeItem(USER_KEY);

        return null;

    }

}


/* =========================================================
   VALIDAR SESIÓN
   ========================================================= */

export function usuarioAutenticado() {

    return getUsuarioActual() !== null;

}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

export function cerrarSesion() {

    sessionStorage.removeItem(USER_KEY);

    window.location.href =
        "./vista-login.html";

}