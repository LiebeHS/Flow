/* =========================================================
   LOGIN
   ========================================================= */

   import {
    API_URL
} from "./config.js";

export function initLogin() {

    const form =
        document.querySelector(
            "#login-form"
        );


    const correo =
        document.querySelector(
            "#login-correo"
        );


    const password =
        document.querySelector(
            "#login-password"
        );


    const error =
        document.querySelector(
            "#login-error"
        );


    const boton =
        document.querySelector(
            "#btn-login"
        );


    if (!form) {

        console.warn(
            "No se encontró #login-form"
        );

        return;

    }


    /* =====================================================
       MOSTRAR / OCULTAR CONTRASEÑA
       ===================================================== */

    const btnPassword =
        document.querySelector(
            "#btn-mostrar-password"
        );


    if (btnPassword) {

        btnPassword.addEventListener(
            "click",
            function () {

                if (
                    password.type ===
                    "password"
                ) {

                    password.type =
                        "text";

                }
                else {

                    password.type =
                        "password";

                }

            }
        );

    }


    /* =====================================================
       INICIAR SESIÓN
       ===================================================== */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (error) {

                error.hidden =
                    true;

            }


            const correoValor =
                correo.value.trim();


            const passwordValor =
                password.value;


            if (
                !correoValor ||
                !passwordValor
            ) {

                if (error) {

                    error.textContent =
                        "Ingresa tu correo y contraseña.";

                    error.hidden =
                        false;

                }

                return;

            }


            try {

                boton.disabled =
                    true;


                boton.textContent =
                    "Iniciando sesión...";


                const response =
                    await fetch(
                         `${API_URL}/login`,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    correo:
                                        correoValor,

                                    password:
                                        passwordValor

                                })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "RESPUESTA LOGIN:",
                    data
                );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data.mensaje ||
                        "No fue posible iniciar sesión."
                    );

                }


                /* =========================================
                   GUARDAR SESIÓN
                   ========================================= */

                sessionStorage.setItem(
                    "flow.usuario",
                    JSON.stringify(
                        data.usuario
                    )
                );


                console.log(
                    "Usuario autenticado:",
                    data.usuario
                );


                /* =========================================
                   ABRIR DASHBOARD
                   ========================================= */

                window.location.href =
                    "./index.html";


            }
            catch (err) {

                console.error(
                    "ERROR LOGIN:",
                    err
                );


                if (error) {

                    error.textContent =
                        err.message ||
                        "Correo o contraseña incorrectos.";

                    error.hidden =
                        false;

                }

            }
            finally {

                boton.disabled =
                    false;


                boton.textContent =
                    "Iniciar sesión";

            }

        }
    );

}