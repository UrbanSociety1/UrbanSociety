/* ==========================================
   URBAN SOCIETY
   CONFIGURACIÓN
========================================== */

const SUPABASE_CONFIG = {
    URL: "https://hwlypgwalwhuqxobxwbn.supabase.co",
    PUBLISHABLE_KEY: "sb_publishable_yqhal6S54Pwai6oBF9JmwA_T1EpWsoO"
};

/*
   Compatibilidad temporal con módulos que todavía llaman iniciarBackendless().
   No contiene credenciales privadas ni conecta con Backendless.
*/
const BACKENDLESS_CONFIG = {
    APPLICATION_ID: "supabase-compat",
    JS_API_KEY: "supabase-compat"
};

/* Formulario de contacto */
window.FORMSPREE_ENDPOINT =
    "https://formspree.io/f/xqpzyrde";

/* Formulario exclusivo para avisos de pedidos */
window.FORMSPREE_ORDERS_ENDPOINT =
    "https://formspree.io/f/xppayvbo";

/*
   La capa Supabase se carga antes de los módulos existentes para que
   catálogo, admin y autenticación puedan seguir usando una interfaz simple.
*/
document.write(
    '<script src="js/supabase-backend.js"><\/script>'
);

document.write(
    '<script src="js/order-notifications.js"><\/script>'
);

document.write(
    '<script src="js/checkout-secure.js"><\/script>'
);

document.write(
    '<script src="js/my-orders.js"><\/script>'
);
