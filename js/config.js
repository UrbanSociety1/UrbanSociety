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

/* Favicon y acceso desde pantalla de inicio */
const URBAN_FAVICON_URL = "images/Logo Urban.png?v=urban-favicon-1";

(function instalarUrbanFavicon() {
    let favicon = document.querySelector('link[rel="icon"]');

    if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        favicon.type = "image/png";
        document.head.appendChild(favicon);
    }

    favicon.href = URBAN_FAVICON_URL;

    let shortcut = document.querySelector('link[rel="shortcut icon"]');
    if (!shortcut) {
        shortcut = document.createElement("link");
        shortcut.rel = "shortcut icon";
        shortcut.type = "image/png";
        document.head.appendChild(shortcut);
    }
    shortcut.href = URBAN_FAVICON_URL;

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
        appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleIcon);
    }
    appleIcon.href = URBAN_FAVICON_URL;
})();

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

/* Menú unificado para todas las pantallas administrativas */
const URBAN_BACKOFFICE_PAGES = [
    "admin.html",
    "pos.html",
    "products.html",
    "orders.html",
    "cash.html",
    "settings.html"
];
const URBAN_CURRENT_PAGE = (location.pathname.split("/").pop() || "").toLowerCase();

if (URBAN_BACKOFFICE_PAGES.includes(URBAN_CURRENT_PAGE)) {
    if (!document.querySelector('link[href="css/backoffice.css"]')) {
        const backoffice = document.createElement("link");
        backoffice.rel = "stylesheet";
        backoffice.href = "css/backoffice.css";
        document.head.appendChild(backoffice);
    }
}

/* Dashboard solo para Inicio / Administración */
if (URBAN_CURRENT_PAGE === "admin.html") {
    if (!document.querySelector('link[href="css/admin-dashboard.css"]')) {
        const dashboardCss = document.createElement("link");
        dashboardCss.rel = "stylesheet";
        dashboardCss.href = "css/admin-dashboard.css";
        document.head.appendChild(dashboardCss);
    }
}

/*
   Algunas páginas antiguas todavía cargan el SDK después.
   Si Supabase JS no está presente, lo cargamos aquí.
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

if (URBAN_BACKOFFICE_PAGES.includes(URBAN_CURRENT_PAGE)) {
    document.write(
        '<script src="js/backoffice-nav.js"><\/script>'
    );
}

if (URBAN_CURRENT_PAGE === "admin.html") {
    document.write(
        '<script src="js/admin-dashboard.js"><\/script>'
    );
    document.write(
        '<script src="js/dedicated-pages-upgrade.js"><\/script>'
    );
}
