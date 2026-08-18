/* ==========================================
   URBAN SOCIETY
   CONFIGURACIÓN
========================================== */

const BACKENDLESS_CONFIG = {

    APPLICATION_ID:
        "EDD079F7-948B-4234-8135-EBB129DF75EA",

    JS_API_KEY:
        "74CB12A4-98F6-499A-8872-9ED95BB43D91",

    API_URL:
        "https://api.backendless.com",

    SUBDOMAIN:
        "shiningsubstance-us.backendless.app"

};

/* Formulario de contacto */
window.FORMSPREE_ENDPOINT =
    "https://formspree.io/f/xqpzyrde";

/* Formulario exclusivo para avisos de pedidos */
window.FORMSPREE_ORDERS_ENDPOINT =
    "https://formspree.io/f/xppayvbo";

/*
   Cargamos el módulo de avisos antes de app.js para que
   pueda escuchar los pedidos guardados en Backendless.
*/
document.write(
    '<script src="js/order-notifications.js"><\/script>'
);
