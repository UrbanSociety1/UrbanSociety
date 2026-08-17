/* =========================================================
   URBAN SOCIETY
   AUTH.JS
   LOGIN / REGISTRO / PROPIETARIO
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let usuarioActual = null;
let usuarioEsOwner = false;


/* =========================================================
   CORREO DEL PROPIETARIO
=========================================================

   CAMBIA ESTE CORREO POR EL CORREO QUE UTILIZARÁS
   COMO PROPIETARIO DE URBAN SOCIETY.

========================================================= */

const OWNER_EMAIL = "mendozaosornio010305@gmail.com";


/* =========================================================
   OBTENER ELEMENTO
========================================================= */

function obtenerElemento(id) {

    return document.getElementById(id);

}


/* =========================================================
   MENSAJE DE AUTENTICACIÓN
========================================================= */

function mostrarMensajeAuth(mensaje, tipo = "error") {

    const elemento =
        obtenerElemento("auth-status");

    if (!elemento) {
        return;
    }


    elemento.textContent =
        mensaje;


    if (tipo === "success") {

        elemento.style.color =
            "#00d26a";

    } else {

        elemento.style.color =
            "#ff0015";

    }

}


/* =========================================================
   MOSTRAR LOGIN
========================================================= */

function mostrarLogin() {

    const tienda =
        obtenerElemento("store-content");

    const login =
        obtenerElemento("login-screen");

    const registro =
        obtenerElemento("register-screen");


    if (tienda) {

        tienda.style.display =
            "none";

    }


    if (registro) {

        registro.style.display =
            "none";

    }


    if (login) {

        login.style.display =
            "flex";

    }


    window.scrollTo(
        0,
        0
    );

}


/* =========================================================
   MOSTRAR REGISTRO
========================================================= */

function mostrarRegistro() {

    const tienda =
        obtenerElemento("store-content");

    const login =
        obtenerElemento("login-screen");

    const registro =
        obtenerElemento("register-screen");


    if (tienda) {

        tienda.style.display =
            "none";

    }


    if (login) {

        login.style.display =
            "none";

    }


    if (registro) {

        registro.style.display =
            "flex";

    }


    window.scrollTo(
        0,
        0
    );

}


/* =========================================================
   MOSTRAR TIENDA
========================================================= */

function mostrarTienda() {

    const tienda =
        obtenerElemento("store-content");

    const login =
        obtenerElemento("login-screen");

    const registro =
        obtenerElemento("register-screen");


    if (login) {

        login.style.display =
            "none";

    }


    if (registro) {

        registro.style.display =
            "none";

    }


    if (tienda) {

        tienda.style.display =
            "block";

    }


    window.scrollTo(
        0,
        0
    );

}


/* =========================================================
   DETECTAR PROPIETARIO
========================================================= */

function detectarPropietario(usuario) {

    usuarioEsOwner =
        false;


    if (!usuario) {

        return false;

    }


    const email =
        String(
            usuario.email || ""
        )
        .trim()
        .toLowerCase();


    const ownerEmail =
        String(
            OWNER_EMAIL
        )
        .trim()
        .toLowerCase();


    if (
        email &&
        ownerEmail &&
        email === ownerEmail
    ) {

        usuarioEsOwner =
            true;

    }


    console.log(
        "Usuario:",
        email
    );


    console.log(
        "Propietario:",
        usuarioEsOwner
    );


    return usuarioEsOwner;

}


/* =========================================================
   MOSTRAR USUARIO EN HEADER
========================================================= */

function actualizarAreaUsuario() {

    const area =
        obtenerElemento("user-area");


    if (!area) {
        return;
    }


    if (!usuarioActual) {

        area.innerHTML = `

            <button
                type="button"
                onclick="mostrarLogin()"
                class="account-button"
            >
                👤 Cuenta
            </button>

        `;

        return;

    }


    const nombre =
        usuarioActual.name ||
        usuarioActual.email ||
        "Usuario";


    const etiquetaOwner =
        usuarioEsOwner
            ? `
                <span
                    style="
                        color:#ff0015;
                        font-size:11px;
                        display:block;
                        margin-top:2px;
                    "
                >
                    PROPIETARIO
                </span>
              `
            : "";


    area.innerHTML = `

        <div
            style="
                position:relative;
                display:flex;
                align-items:center;
                gap:10px;
            "
        >

            <button
                type="button"
                class="account-button"
                onclick="mostrarMenuCuenta()"
            >

                👤

                <span>

                    ${escapeHTML(nombre)}

                    ${etiquetaOwner}

                </span>

            </button>

        </div>

    `;

}


/* =========================================================
   MENÚ DE CUENTA
========================================================= */

function mostrarMenuCuenta() {

    const existente =
        document.getElementById(
            "account-menu"
        );


    if (existente) {

        existente.remove();

        return;

    }


    const menu =
        document.createElement(
            "div"
        );


    menu.id =
        "account-menu";


    menu.style.position =
        "fixed";

    menu.style.top =
        "105px";

    menu.style.right =
        "25px";

    menu.style.zIndex =
        "10000";

    menu.style.width =
        "280px";

    menu.style.padding =
        "20px";

    menu.style.background =
        "#0d0d0d";

    menu.style.border =
        "1px solid rgba(255,0,21,.35)";

    menu.style.borderRadius =
        "14px";

    menu.style.boxShadow =
        "0 20px 60px rgba(0,0,0,.6)";


    const nombre =
        usuarioActual?.name ||
        usuarioActual?.email ||
        "Usuario";


    menu.innerHTML = `

        <div
            style="
                padding-bottom:15px;
                border-bottom:1px solid #222;
                margin-bottom:15px;
            "
        >

            <strong>
                ${escapeHTML(nombre)}
            </strong>

            <div
                style="
                    color:#888;
                    font-size:12px;
                    margin-top:5px;
                    word-break:break-word;
                "
            >
                ${escapeHTML(
                    usuarioActual?.email || ""
                )}
            </div>

            ${
                usuarioEsOwner
                ?
                `
                <div
                    style="
                        color:#ff0015;
                        font-size:12px;
                        font-weight:800;
                        margin-top:8px;
                    "
                >
                    👑 PROPIETARIO
                </div>
                `
                :
                ""
            }

        </div>


        ${
            usuarioEsOwner
            ?
            `
            <button
                type="button"
                onclick="irAlPanelAdmin()"
                style="
                    width:100%;
                    margin-bottom:10px;
                "
            >
                👑 PANEL DEL PROPIETARIO
            </button>
            `
            :
            ""
        }


        <button
            type="button"
            onclick="cerrarSesion()"
            class="btn-secondary"
            style="width:100%;"
        >
            CERRAR SESIÓN
        </button>

    `;


    document.body.appendChild(
        menu
    );

}


/* =========================================================
   IR AL PANEL ADMIN
========================================================= */

function irAlPanelAdmin() {

    if (!usuarioActual) {

        alert(
            "Debes iniciar sesión."
        );

        mostrarLogin();

        return;

    }


    if (!usuarioEsOwner) {

        alert(
            "No tienes permisos de propietario."
        );

        return;

    }


    window.location.href =
        "admin.html";

}


/* =========================================================
   REGISTRAR USUARIO
========================================================= */

async function registrarUsuario(event) {

    event.preventDefault();


    if (
        typeof Backendless ===
        "undefined"
    ) {

        mostrarMensajeAuth(
            "Backendless no está disponible."
        );

        return;

    }


    const nombre =
        obtenerElemento(
            "register-name"
        )?.value.trim();


    const email =
        obtenerElemento(
            "register-email"
        )?.value.trim();


    const password =
        obtenerElemento(
            "register-password"
        )?.value;


    const confirmPassword =
        obtenerElemento(
            "register-password-confirm"
        )?.value;


    if (
        !nombre ||
        !email ||
        !password
    ) {

        mostrarMensajeAuth(
            "Completa todos los campos."
        );

        return;

    }


    if (
        password.length < 6
    ) {

        mostrarMensajeAuth(
            "La contraseña debe tener al menos 6 caracteres."
        );

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        mostrarMensajeAuth(
            "Las contraseñas no coinciden."
        );

        return;

    }


    mostrarMensajeAuth(
        "Creando cuenta...",
        "success"
    );


    try {

        const user =
            new Backendless.User();

        user.name =
            nombre;

        user.email =
            email;

        user.password =
            password;


        const registrado =
            await Backendless.UserService.register(
                user
            );


        console.log(
            "Usuario registrado:",
            registrado
        );


        mostrarMensajeAuth(
            "Cuenta creada correctamente. Ahora puedes iniciar sesión.",
            "success"
        );


        const formulario =
            obtenerElemento(
                "register-form"
            );


        if (formulario) {

            formulario.reset();

        }


        setTimeout(
            function () {

                mostrarLogin();

            },
            1200
        );


    } catch (error) {

        console.error(
            "Error registrando usuario:",
            error
        );


        mostrarMensajeAuth(
            obtenerMensajeError(
                error,
                "No se pudo crear la cuenta."
            )
        );

    }

}


/* =========================================================
   INICIAR SESIÓN
========================================================= */

async function iniciarSesion(event) {

    event.preventDefault();


    if (
        typeof Backendless ===
        "undefined"
    ) {

        mostrarMensajeAuth(
            "Backendless no está disponible."
        );

        return;

    }


    const email =
        obtenerElemento(
            "login-email"
        )?.value.trim();


    const password =
        obtenerElemento(
            "login-password"
        )?.value;


    if (
        !email ||
        !password
    ) {

        mostrarMensajeAuth(
            "Introduce tu correo y contraseña."
        );

        return;

    }


    mostrarMensajeAuth(
        "Iniciando sesión...",
        "success"
    );


    try {

        const usuario =
            await Backendless.UserService.login(
                email,
                password,
                true
            );


        usuarioActual =
            usuario;


        detectarPropietario(
            usuarioActual
        );


        console.log(
            "Sesión iniciada:",
            usuarioActual
        );


        actualizarAreaUsuario();


        mostrarMensajeAuth(
            "Sesión iniciada correctamente.",
            "success"
        );


        const formulario =
            obtenerElemento(
                "login-form"
            );


        if (formulario) {

            formulario.reset();

        }


        setTimeout(
            function () {

                mostrarTienda();

                if (usuarioEsOwner) {

                    console.log(
                        "👑 Propietario detectado."
                    );

                }

            },
            700
        );


    } catch (error) {

        console.error(
            "Error iniciando sesión:",
            error
        );


        mostrarMensajeAuth(
            obtenerMensajeError(
                error,
                "Correo o contraseña incorrectos."
            )
        );

    }

}


/* =========================================================
   CERRAR SESIÓN
========================================================= */

async function cerrarSesion() {

    try {

        if (
            typeof Backendless !==
            "undefined"
        ) {

            await Backendless.UserService.logout();

        }


        usuarioActual =
            null;

        usuarioEsOwner =
            false;


        const menu =
            obtenerElemento(
                "account-menu"
            );


        if (menu) {

            menu.remove();

        }


        actualizarAreaUsuario();


        mostrarTienda();


        console.log(
            "Sesión cerrada."
        );


    } catch (error) {

        console.error(
            "Error cerrando sesión:",
            error
        );


        alert(
            "No se pudo cerrar la sesión."
        );

    }

}


/* =========================================================
   CARGAR SESIÓN EXISTENTE
========================================================= */

async function cargarSesionExistente() {

    try {

        if (
            typeof Backendless ===
            "undefined"
        ) {

            return;

        }


        usuarioActual =
            await Backendless.UserService.getCurrentUser();


        if (usuarioActual) {

            detectarPropietario(
                usuarioActual
            );


            actualizarAreaUsuario();


            console.log(
                "Sesión encontrada:",
                usuarioActual.email
            );

        } else {

            usuarioActual =
                null;

            usuarioEsOwner =
                false;


            actualizarAreaUsuario();

        }

    } catch (error) {

        console.warn(
            "No hay una sesión activa.",
            error
        );


        usuarioActual =
            null;

        usuarioEsOwner =
            false;


        actualizarAreaUsuario();

    }

}


/* =========================================================
   MENSAJES DE ERROR
========================================================= */

function obtenerMensajeError(
    error,
    mensajeDefault
) {

    if (!error) {

        return mensajeDefault;

    }


    const texto =
        String(
            error.message ||
            error.description ||
            error.code ||
            ""
        );


    if (
        texto.toLowerCase()
            .includes("already")
    ) {

        return "Ese correo ya está registrado.";

    }


    if (
        texto.toLowerCase()
            .includes("invalid")
    ) {

        return "Los datos introducidos no son válidos.";

    }


    if (
        texto.toLowerCase()
            .includes("password")
    ) {

        return "La contraseña no es correcta.";

    }


    return (
        error.message ||
        error.description ||
        mensajeDefault
    );

}


/* =========================================================
   SEGURIDAD BÁSICA PARA TEXTO HTML
========================================================= */

function escapeHTML(valor) {

    return String(
        valor ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   EVENTOS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Auth.js iniciado."
        );


        const loginForm =
            obtenerElemento(
                "login-form"
            );


        const registerForm =
            obtenerElemento(
                "register-form"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                iniciarSesion
            );

        }


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                registrarUsuario
            );

        }


        /*
         * Esperamos un poco para asegurarnos
         * de que Backendless ya esté cargado.
         */

        setTimeout(
            async function () {

                await cargarSesionExistente();

            },
            300
        );

    }
);