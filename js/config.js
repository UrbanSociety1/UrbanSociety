/* ==========================================
   URBAN SOCIETY
   CONFIGURACIÓN
========================================== */

const SUPABASE_CONFIG = {
    URL: "https://hwlypgwalwhuqxobxwbn.supabase.co",
    PUBLISHABLE_KEY: "sb_publishable_yqhal6S54Pwai6oBF9JmwA_T1EpWsoO"
};

/*
   Compatibilidad temporal con módulos antiguos del frontend.
   No contiene credenciales privadas ni conecta con Backendless.
*/
const BACKENDLESS_CONFIG = {
    APPLICATION_ID: "supabase-compat",
    JS_API_KEY: "supabase-compat"
};

/* Formulario de contacto */
window.FORMSPREE_ENDPOINT =
    "https://formspree.io/f/xqpzyrde";

/* Avisos de pedidos */
window.FORMSPREE_ORDERS_ENDPOINT =
    "https://formspree.io/f/xppayvbo";

/* Capa visual final */
if (!document.querySelector('link[href="css/polish.css"]')) {
    const polish = document.createElement("link");
    polish.rel = "stylesheet";
    polish.href = "css/polish.css";
    document.head.appendChild(polish);
}

/*
   admin.html conserva temporalmente una referencia antigua de SDK.
   Si Supabase JS todavía no está presente, lo cargamos aquí.
*/
if (!window.supabase) {
    document.write(
        '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"><\/script>'
    );
}

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
