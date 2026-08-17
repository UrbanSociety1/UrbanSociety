/* ==========================================
   URBAN SOCIETY
   BACKENDLESS.JS
   CONEXIÓN PRINCIPAL
========================================== */


/* ==========================================
   INICIAR BACKENDLESS
========================================== */

function iniciarBackendless() {

    if (
        typeof Backendless === "undefined"
    ) {

        console.error(
            "ERROR: Backendless SDK no está cargado."
        );

        return false;
    }


    if (
        typeof BACKENDLESS_CONFIG ===
        "undefined"
    ) {

        console.error(
            "ERROR: BACKENDLESS_CONFIG no está definido."
        );

        return false;
    }


    try {

        Backendless.initApp(

            BACKENDLESS_CONFIG.APPLICATION_ID,

            BACKENDLESS_CONFIG.JS_API_KEY

        );


        console.log(
            "Backendless conectado correctamente."
        );


        return true;


    } catch (error) {

        console.error(
            "Error iniciando Backendless:",
            error
        );

        return false;

    }

}


/* ==========================================
   OBTENER USUARIO ACTUAL
========================================== */

async function obtenerUsuarioActual() {

    try {

        if (
            typeof Backendless ===
            "undefined"
        ) {

            return null;

        }


        const usuario =
            await Backendless.UserService
                .getCurrentUser();


        if (usuario) {

            console.log(
                "Usuario conectado:",
                usuario.email
            );

        } else {

            console.log(
                "No hay usuario conectado."
            );

        }


        return usuario;


    } catch (error) {

        console.error(
            "Error obteniendo usuario:",
            error
        );

        return null;

    }

}


/* ==========================================
   VERIFICAR SESIÓN
========================================== */

async function comprobarSesionBackendless() {

    try {

        const usuario =
            await obtenerUsuarioActual();


        return !!usuario;


    } catch (error) {

        console.error(
            "Error comprobando sesión:",
            error
        );

        return false;

    }

}


/* ==========================================
   VERIFICAR PROPIETARIO
========================================== */

async function verificarOwner() {

    try {

        const usuario =
            await obtenerUsuarioActual();


        if (!usuario) {

            alert(
                "Debes iniciar sesión para entrar al panel."
            );


            window.location.href =
                "UrbanSociety.html";


            return false;

        }


        /*
           El propietario se determina mediante
           OWNER_EMAIL definido en auth.js.
        */

        const email =
            String(
                usuario.email || ""
            )
                .trim()
                .toLowerCase();


        const ownerEmail =
            typeof OWNER_EMAIL !==
            "undefined"
                ? String(
                    OWNER_EMAIL
                )
                    .trim()
                    .toLowerCase()
                : "";


        const esOwner =
            email ===
            ownerEmail;


        /*
           También permitimos role = owner.
        */

        const role =
            String(
                usuario.role || ""
            )
                .trim()
                .toLowerCase();


        const tieneRolOwner =
            role === "owner" ||
            role === "admin";


        if (
            !esOwner &&
            !tieneRolOwner
        ) {

            alert(
                "Acceso denegado. Esta sección es únicamente para el propietario."
            );


            window.location.href =
                "UrbanSociety.html";


            return false;

        }


        console.log(
            "Acceso de propietario autorizado."
        );


        return true;


    } catch (error) {

        console.error(
            "Error verificando propietario:",
            error
        );


        alert(
            "No se pudo comprobar el acceso."
        );


        window.location.href =
            "UrbanSociety.html";


        return false;

    }

}


/* ==========================================
   CERRAR SESIÓN
========================================== */

async function cerrarSesionBackendless() {

    try {

        if (
            typeof Backendless ===
            "undefined"
        ) {

            return false;

        }


        await Backendless.UserService
            .logout();


        console.log(
            "Sesión cerrada correctamente."
        );


        return true;


    } catch (error) {

        console.error(
            "Error cerrando sesión:",
            error
        );


        return false;

    }

}


/* ==========================================
   INICIALIZAR
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarBackendless();

    }
);


/* ==========================================
   EXPORTAR FUNCIONES
========================================== */

window.iniciarBackendless =
    iniciarBackendless;

window.obtenerUsuarioActual =
    obtenerUsuarioActual;

window.comprobarSesionBackendless =
    comprobarSesionBackendless;

window.verificarOwner =
    verificarOwner;

window.cerrarSesionBackendless =
    cerrarSesionBackendless;