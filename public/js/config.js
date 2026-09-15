/* =========================================================
   URBAN SOCIETY
   BACKENDLESS CONFIGURATION
========================================================= */

const BACKENDLESS_CONFIG = {

  APPLICATION_ID: "EDD079F7-948B-4234-8135-EBB129DF75EA",

  JS_API_KEY: "74CB12A4-98F6-499A-8872-9ED95BB43D91",

  SUBDOMAIN: "https://madebubble-us.backendless.app",

  TABLES: {
    PRODUCTS: "products",
    ORDERS: "orders",
    CUSTOMER_PROFILES: "customer_profiles",
    STAFF_MEMBERS: "staff_members",
    STORE_SETTINGS: "store_settings",
    INVENTORY_MOVEMENTS: "inventory_movements",
    POS_SALES: "pos_sales",
    POS_RETURNS: "pos_returns"
  },

  FILES: {
    PRODUCTS: "products"
  }

};

window.BACKENDLESS_CONFIG = BACKENDLESS_CONFIG;
window.API_URL =
  "https://urbansociety.mendozaosornio010305-8a0.workers.dev";

console.info("Urban Society: configuración Backendless cargada.");