```javascript
// ==========================================
// URBANSOCIETY
// URBANBOT 1.0
// ==========================================


let urbanBotInicializado = false;


// ==========================================
// INICIALIZAR BOT
// ==========================================

function iniciarUrbanBot() {

    if (urbanBotInicializado) {
        return;
    }

    urbanBotInicializado = true;


    const input =
        document.getElementById(
            "urbanbot-pregunta"
        );


    if (input) {

        input.addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Enter") {

                    urbanBotResponder();

                }

            }
        );

    }

}


// ==========================================
// RESPONDER
// ==========================================

async function urbanBotResponder() {

    const input =
        document.getElementById(
            "urbanbot-pregunta"
        );

    const mensajes =
        document.getElementById(
            "urbanbot-mensajes"
        );


    if (!input || !mensajes) {
        return;
    }


    const pregunta =
        input.value.trim();


    if (!pregunta) {
        return;
    }


    // Mostrar pregunta
    mensajes.innerHTML += `

        <div class="usuario-mensaje">
            ${urbanBotEscapar(pregunta)}
        </div>

    `;


    input.value = "";


    // Scroll
    mensajes.scrollTop =
        mensajes.scrollHeight;


    // Indicador
    const indicador =
        document.createElement("div");


    indicador.className =
        "bot-mensaje";


    indicador.id =
        "urbanbot-escribiendo";


    indicador.innerHTML =
        "🤖 Estoy buscando información...";


    mensajes.appendChild(
        indicador
    );


    try {

        const respuesta =
            await urbanBotProcesar(
                pregunta
            );


        indicador.remove();


        mensajes.innerHTML += `

            <div class="bot-mensaje">
                ${respuesta}
            </div>

        `;

    }

    catch (error) {

        console.error(error);


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


// ==========================================
// PROCESAR PREGUNTA
// ==========================================

async function urbanBotProcesar(texto) {

    const pregunta =
        texto
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );


    // ======================================
    // SALUDOS
    // ======================================

    if (
        pregunta.includes("hola") ||
        pregunta.includes("buenas") ||
        pregunta.includes("hey")
    ) {

        return `
            👋 ¡Hola! Soy <strong>UrbanBot</strong>.
            <br><br>
            Puedo ayudarte a buscar productos,
            consultar precios y conocer información
            de UrbanSociety.
        `;

    }


    // ======================================
    // ENVÍOS
    // ======================================

    if (
        pregunta.includes("envio") ||
        pregunta.includes("entrega")
    ) {

        return `
            📦 Realizamos envíos a todo México.
            <br><br>
            Si quieres buscar un producto,
            dime su nombre.
        `;

    }


    // ======================================
    // PAGOS
    // ======================================

    if (
        pregunta.includes("pago") ||
        pregunta.includes("tarjeta") ||
        pregunta.includes("transferencia")
    ) {

        return `
            💳 Puedes consultar los métodos de pago
            disponibles durante el proceso de compra.
        `;

    }


    // ======================================
    // CONTACTO
    // ======================================

    if (
        pregunta.includes("contacto") ||
        pregunta.includes("whatsapp") ||
        pregunta.includes("soporte")
    ) {

        return `
            📲 Puedes comunicarte con nuestro
            equipo de soporte mediante WhatsApp.
        `;

    }


    // ======================================
    // PRODUCTOS
    // ======================================

    const palabrasProducto = [
        "playera",
        "camiseta",
        "sudadera",
        "hoodie",
        "pantalon",
        "pantalón",
        "gorra",
        "tenis",
        "zapatos"
    ];


    const buscaProducto =
        palabrasProducto.some(
            palabra =>
                pregunta.includes(palabra)
        );


    if (buscaProducto) {

        try {

            let productos =
                await elementaryAPI.obtenerProductos();


            productos =
                Array.isArray(productos)
                    ? productos
                    : (
                        productos.data ||
                        productos.products ||
                        []
                    );


            if (!productos.length) {

                return `
                    🛍️ No encontré productos
                    disponibles en este momento.
                `;

            }


            const encontrados =
                productos.filter(producto => {

                    const nombre =
                        String(
                            producto.name ||
                            producto.nombre ||
                            producto.title ||
                            ""
                        ).toLowerCase();


                    return palabrasProducto.some(
                        palabra =>
                            nombre.includes(palabra)
                    );

                });


            if (!encontrados.length) {

                return `
                    🔎 No encontré exactamente
                    ese producto.
                    <br><br>
                    Puedes intentar con otro nombre.
                `;

            }


            return urbanBotMostrarProductos(
                encontrados
            );

        }

        catch (error) {

            console.error(error);

            return `
                ⚠️ No pude consultar el catálogo
                en este momento.
            `;

        }

    }


    // ======================================
    // PRECIO
    // ======================================

    if (
        pregunta.includes("precio") ||
        pregunta.includes("cuanto cuesta") ||
        pregunta.includes("cuánto cuesta")
    ) {

        return `
            💰 Claro. Dime el nombre exacto
            del producto y consultaré su información.
            <br><br>
            Ejemplo:
            <br>
            <strong>Precio de la sudadera negra</strong>
        `;

    }


    // ======================================
    // AGRADECIMIENTO
    // ======================================

    if (
        pregunta.includes("gracias") ||
        pregunta.includes("muchas gracias")
    ) {

        return `
            😎 ¡De nada!
            <br><br>
            Gracias por visitar UrbanSociety.
        `;

    }


    // ======================================
    // DESPEDIDA
    // ======================================

    if (
        pregunta.includes("adios") ||
        pregunta.includes("adiós")
    ) {

        return `
            👋 ¡Hasta luego!
            <br><br>
            Esperamos verte nuevamente en UrbanSociety.
        `;

    }


    // ======================================
    // RESPUESTA GENERAL
    // ======================================

    return `
        🤖 Todavía estoy aprendiendo.
        <br><br>

        Puedes preguntarme cosas como:

        <br>👕 ¿Qué playeras tienen?
        <br>🧥 ¿Qué sudaderas tienen?
        <br>💰 ¿Cuánto cuesta un producto?
        <br>📦 ¿Hacen envíos?
        <br>💳 ¿Qué métodos de pago tienen?
        <br>📲 ¿Cómo contacto con soporte?
    `;

}


// ==========================================
// MOSTRAR PRODUCTOS
// ==========================================

function urbanBotMostrarProductos(
    productos
) {

    let html =
        "🛍️ Encontré estos productos:<br><br>";


    productos
        .slice(
            0,
            URBAN_CONFIG.BOT.MAX_PRODUCTS
        )
        .forEach(producto => {

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
                "";


            html += `

                <div style="
                    padding:10px;
                    margin-bottom:8px;
                    border-radius:10px;
                    background:#333;
                ">

                    <strong>
                        ${nombre}
                    </strong>

                    ${precio !== "" ? "<br>💰 $" + precio : ""}

                </div>

            `;

        });


    return html;

}


// ==========================================
// SEGURIDAD
// ==========================================

function urbanBotEscapar(texto) {

    return String(texto)

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


// ==========================================
// INICIAR
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarUrbanBot
);
```
