// ==========================================
// URBANSOCIETY
// URBANBOT 1.1
// ==========================================

let urbanBotInicializado = false;

function iniciarUrbanBot() {

    if (urbanBotInicializado) {
        return;
    }

    urbanBotInicializado = true;

    const input = document.getElementById("urbanbot-pregunta");

    if (input) {

        input.addEventListener("keydown", function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                urbanBotResponder();

            }

        });

    }

}

async function urbanBotResponder() {

    const input =
        document.getElementById("urbanbot-pregunta");

    const mensajes =
        document.getElementById("urbanbot-mensajes");

    if (!input || !mensajes) {

        console.warn(
            "UrbanBot: no se encontraron los elementos HTML."
        );

        return;

    }

    const pregunta =
        input.value.trim();

    if (!pregunta) {
        return;
    }

    mensajes.innerHTML += `
        <div class="usuario-mensaje">
            ${urbanBotEscapar(pregunta)}
        </div>
    `;

    input.value = "";

    mensajes.scrollTop =
        mensajes.scrollHeight;

    const indicador =
        document.createElement("div");

    indicador.className =
        "bot-mensaje";

    indicador.id =
        "urbanbot-escribiendo";

    indicador.innerHTML =
        "🤖 Estoy buscando información...";

    mensajes.appendChild(indicador);

    try {

        const respuesta =
            await urbanBotProcesar(pregunta);

        indicador.remove();

        mensajes.innerHTML += `
            <div class="bot-mensaje">
                ${respuesta}
            </div>
        `;

    }

    catch (error) {

        console.error(
            "UrbanBot:",
            error
        );

        indicador.remove();

        mensajes.innerHTML += `
            <div class="bot-mensaje">
                ❌ No pude consultar la información
                en este momento.
                <br><br>
                Intenta nuevamente.
            </div>
        `;

    }

    mensajes.scrollTop =
        mensajes.scrollHeight;

}

async function urbanBotProcesar(texto) {

    const pregunta =
        String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );

    if (
        pregunta.includes("hola") ||
        pregunta.includes("buenas") ||
        pregunta.includes("hey")
    ) {

        return `
            👋 ¡Hola! Soy <strong>UrbanBot</strong>.
            <br><br>
            Puedo ayudarte con productos,
            precios y información de UrbanSociety.
        `;

    }

    if (
        pregunta.includes("envio") ||
        pregunta.includes("envios") ||
        pregunta.includes("entrega")
    ) {

        return `
            📦 <strong>Envíos</strong>
            <br><br>
            Realizamos envíos a todo México.
        `;

    }

    if (
        pregunta.includes("pago") ||
        pregunta.includes("pagos") ||
        pregunta.includes("tarjeta") ||
        pregunta.includes("transferencia")
    ) {

        return `
            💳 <strong>Pagos</strong>
            <br><br>
            Puedes consultar los métodos de pago
            disponibles durante el proceso de compra.
        `;

    }

    if (
        pregunta.includes("contacto") ||
        pregunta.includes("whatsapp") ||
        pregunta.includes("soporte")
    ) {

        return `
            📲 <strong>Soporte</strong>
            <br><br>
            Puedes comunicarte con nuestro equipo
            mediante los canales de contacto
            disponibles en UrbanSociety.
        `;

    }

    const palabrasProducto = [
        "playera",
        "camiseta",
        "sudadera",
        "hoodie",
        "pantalon",
        "gorra",
        "tenis",
        "zapatos",
        "producto",
        "productos"
    ];

    const buscaProducto =
        palabrasProducto.some(
            palabra =>
                pregunta.includes(palabra)
        );

    if (buscaProducto) {

        try {

            const productos =
                await elementaryAPI.obtenerProductos();

            const lista =
                urbanBotNormalizarProductos(productos);

            if (!lista.length) {

                return `
                    🛍️ No encontré productos disponibles
                    en este momento.
                `;

            }

            return urbanBotCrearListaProductos(
                lista.slice(0, 10)
            );

        }

        catch (error) {

            console.error(
                "UrbanBot - productos:",
                error
            );

            return `
                ⚠️ No pude consultar el catálogo
                en este momento.
            `;

        }

    }

    if (
        pregunta.includes("precio") ||
        pregunta.includes("cuanto cuesta") ||
        pregunta.includes("cuesta")
    ) {

        return `
            💰 Puedo ayudarte a consultar precios.
            <br><br>
            Escribe el nombre del producto.
        `;

    }

    return `
        🤖 No estoy seguro de haber entendido.
        <br><br>
        Puedes preguntarme:
        <br>
        • ¿Qué productos tienen?
        <br>
        • ¿Cuánto cuesta una playera?
        <br>
        • ¿Tienen sudaderas?
        <br>
        • ¿Hacen envíos?
        <br>
        • ¿Qué métodos de pago tienen?
    `;

}

function urbanBotNormalizarProductos(datos) {

    if (Array.isArray(datos)) {
        return datos;
    }

    if (
        datos &&
        Array.isArray(datos.data)
    ) {
        return datos.data;
    }

    if (
        datos &&
        Array.isArray(datos.products)
    ) {
        return datos.products;
    }

    if (
        datos &&
        Array.isArray(datos.items)
    ) {
        return datos.items;
    }

    return [];

}

function urbanBotCrearListaProductos(productos) {

    if (!productos.length) {

        return `
            🛍️ No encontré productos disponibles.
        `;

    }

    let html =
        "🛍️ <strong>Productos encontrados:</strong><br><br>";

    productos.forEach(producto => {

        const nombre =
            urbanBotEscapar(
                String(
                    producto.name ||
                    producto.nombre ||
                    producto.title ||
                    "Producto"
                )
            );

        const precio =
            producto.price ??
            producto.precio ??
            producto.sale_price ??
            producto.salePrice;

        html += `
            <div class="urbanbot-producto"
                 style="margin-bottom:10px;padding:10px;border-radius:8px;background:rgba(255,255,255,0.05);">

                <strong>${nombre}</strong>
        `;

        if (
            precio !== undefined &&
            precio !== null &&
            precio !== ""
        ) {

            html += `
                <br>
                💰 $${urbanBotEscapar(
                    String(precio)
                )}
            `;

        }

        html += `
            </div>
        `;

    });

    return html;

}

function urbanBotEscapar(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarUrbanBot
    );

}
else {

    iniciarUrbanBot();

}