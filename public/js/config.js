```javascript
// ==========================================
// URBANSOCIETY - CONFIGURACIÓN GENERAL
// ==========================================

const URBAN_CONFIG = {

    // Nombre de la tienda
    APP_NAME: "UrbanSociety",

    // Nombre del asistente
    BOT_NAME: "UrbanBot",

    // Elementary POS
    ELEMENTARY: {

        // Activar/desactivar conexión
        ENABLED: true,

        // URL de tu API/proxy
        PROXY_ENABLED: true,

        // Cuando uses Cloudflare Worker:
        PROXY_URL: "/api/elementary",

        // API directa solamente para pruebas.
        // NO colocar la API KEY aquí en producción.
        API_URL: "https://api.elementarypos.com",

        // Tiempo máximo de espera
        TIMEOUT: 10000
    },

    // Configuración de UrbanBot
    BOT: {

        VERSION: "1.0",

        WELCOME:
            "¡Hola! 👋 Soy UrbanBot, el asistente virtual de UrbanSociety. ¿En qué puedo ayudarte?",

        MAX_PRODUCTS: 20
    }
};
```
