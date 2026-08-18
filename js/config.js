/* ==========================================
   URBAN SOCIETY
   CONFIGURACIÓN
========================================== */

const SUPABASE_CONFIG = {
    URL: "https://hwlypgwalwhuqxobxwbn.supabase.co",
    PUBLISHABLE_KEY: "sb_publishable_yqhal6S54Pwai6oBF9JmwA_T1EpWsoO"
};

/* Compatibilidad temporal con módulos antiguos del frontend. */
const BACKENDLESS_CONFIG = { APPLICATION_ID: "supabase-compat", JS_API_KEY: "supabase-compat" };
const URBAN_FAVICON_URL = "images/Logo Urban.png?v=urban-favicon-1";

(function instalarUrbanFavicon() {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) { favicon = document.createElement("link"); favicon.rel = "icon"; favicon.type = "image/png"; document.head.appendChild(favicon); }
    favicon.href = URBAN_FAVICON_URL;
    let shortcut = document.querySelector('link[rel="shortcut icon"]');
    if (!shortcut) { shortcut = document.createElement("link"); shortcut.rel = "shortcut icon"; shortcut.type = "image/png"; document.head.appendChild(shortcut); }
    shortcut.href = URBAN_FAVICON_URL;
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) { appleIcon = document.createElement("link"); appleIcon.rel = "apple-touch-icon"; document.head.appendChild(appleIcon); }
    appleIcon.href = URBAN_FAVICON_URL;
})();

window.FORMSPREE_ENDPOINT = "https://formspree.io/f/xqpzyrde";
window.FORMSPREE_ORDERS_ENDPOINT = "https://formspree.io/f/xppayvbo";

function urbanAddCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = href; document.head.appendChild(link);
}
urbanAddCss("css/polish.css");

const URBAN_BACKOFFICE_PAGES = [
    "admin.html","pos.html","products.html","orders.html","cash.html","reports.html",
    "returns.html","inventory.html","customers.html","staff.html","settings.html"
];
const URBAN_PATH_PAGE = (location.pathname.split("/").pop() || "").toLowerCase();
const URBAN_CURRENT_PAGE = URBAN_PATH_PAGE || "index.html";
const URBAN_STOREFRONT_PAGES = ["index.html", "urbansociety.html"];

if (URBAN_BACKOFFICE_PAGES.includes(URBAN_CURRENT_PAGE)) {
    urbanAddCss("css/backoffice.css");
    urbanAddCss("css/suite.css");
}
if (URBAN_CURRENT_PAGE === "admin.html") urbanAddCss("css/admin-dashboard.css");

if (!window.supabase) document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"><\/script>');
document.write('<script src="js/supabase-backend.js"><\/script>');
document.write('<script src="js/order-notifications.js"><\/script>');
document.write('<script src="js/checkout-secure.js"><\/script>');
document.write('<script src="js/my-orders.js"><\/script>');

if (URBAN_STOREFRONT_PAGES.includes(URBAN_CURRENT_PAGE)) document.write('<script src="js/customer-account-link.js"><\/script>');

if (URBAN_BACKOFFICE_PAGES.includes(URBAN_CURRENT_PAGE)) {
    document.write('<script src="js/access.js"><\/script>');
    document.write('<script src="js/backoffice-nav.js"><\/script>');
    document.write('<script src="js/backoffice-alerts.js"><\/script>');
}

if (URBAN_CURRENT_PAGE === "admin.html") {
    document.write('<script src="js/admin-dashboard.js"><\/script>');
    document.write('<script src="js/dedicated-pages-upgrade.js"><\/script>');
}

document.write('<script src="js/pwa.js"><\/script>');
