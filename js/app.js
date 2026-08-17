/* ==========================================
   URBAN SOCIETY
   APP.JS
   PRODUCTOS / CARRITO / PEDIDOS
========================================== */

let productosUrban = [];
let carritoUrban = [];

const PRODUCTS_TABLE = "Products";
const ORDERS_TABLE = "Orders";


document.addEventListener("DOMContentLoaded", async () => {

    cargarCarritoLocal();

    actualizarCarritoUI();

    configurarBuscador();

    await cargarProductos();

});


/* ==========================================
   PRODUCTOS
========================================== */

async function cargarProductos() {

    const container =
        document.getElementById("products-grid");

    if (!container) return;

    container.innerHTML = `
        <div class="loading-products">
            Cargando productos...
        </div>
    `;

    try {

        const query =
            Backendless.DataQueryBuilder
                .create()
                .setSortBy(["created DESC"]);

        const resultado =
            await Backendless.Data.of(
                PRODUCTS_TABLE
            ).find(query);

        productosUrban =
            resultado || [];

        mostrarProductos(
            productosUrban
        );

    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

        container.innerHTML = `
            <div class="admin-error">

                <h3>
                    No se pudieron cargar los productos
                </h3>

                <p>
                    Revisa la conexión con Backendless
                    y que exista la tabla Products.
                </p>

            </div>
        `;

    }

}


/* ==========================================
   MOSTRAR PRODUCTOS
========================================== */

function mostrarProductos(
    productos
) {

    const container =
        document.getElementById(
            "products-grid"
        );

    if (!container) return;


    if (!productos.length) {

        container.innerHTML = `
            <div class="empty-products">

                <h3>
                    Próximamente
                </h3>

                <p>
                    Todavía no hay productos
                    disponibles.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        productos.map(
            producto => crearTarjetaProducto(
                producto
            )
        ).join("");

}


/* ==========================================
   TARJETA PRODUCTO
========================================== */

function crearTarjetaProducto(
    producto
) {

    const id =
        producto.objectId || "";

    const nombre =
        escaparHTML(
            producto.name ||
            "Producto"
        );

    const categoria =
        escaparHTML(
            producto.category ||
            "General"
        );

    const descripcion =
        escaparHTML(
            producto.description ||
            "Producto Urban Society."
        );

    const imagen =
        producto.image ||
        producto.imageUrl ||
        "images/Logo Urban.png";

    const precio =
        Number(
            producto.price || 0
        );

    const stock =
        Number(
            producto.stock || 0
        );

    const disponible =
        stock > 0;


    return `

        <article
            class="product-card"
        >

            <div
                class="product-image-container"
                onclick="abrirProducto('${id}')"
            >

                <img
                    class="product-image"
                    src="${escaparHTML(imagen)}"
                    alt="${nombre}"
                    loading="lazy"
                    onerror="
                        this.src='images/Logo Urban.png'
                    "
                >

                <span
                    class="
                        product-stock
                        ${disponible ? "available" : ""}
                    "
                >

                    ${
                        disponible
                            ? `Stock: ${stock}`
                            : "Agotado"
                    }

                </span>

            </div>


            <div
                class="product-info"
            >

                <span
                    class="product-category"
                >
                    ${categoria}
                </span>


                <h3>
                    ${nombre}
                </h3>


                <p
                    class="product-description"
                >
                    ${descripcion}
                </p>


                <div
                    class="product-bottom"
                >

                    <strong
                        class="product-price"
                    >
                        ${formatearPrecio(precio)}
                    </strong>


                    <button
                        type="button"
                        class="add-cart-button"
                        ${
                            !disponible
                                ? "disabled"
                                : ""
                        }
                        onclick="
                            agregarAlCarrito('${id}')
                        "
                    >
                        ${
                            disponible
                                ? "Agregar"
                                : "Agotado"
                        }
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* ==========================================
   ABRIR PRODUCTO
========================================== */

function abrirProducto(
    id
) {

    const producto =
        productosUrban.find(
            item =>
                item.objectId === id
        );

    if (!producto) return;


    const modal =
        document.getElementById(
            "product-modal"
        );

    if (!modal) return;


    const imagen =
        document.getElementById(
            "modal-image"
        );

    const categoria =
        document.getElementById(
            "modal-category"
        );

    const nombre =
        document.getElementById(
            "modal-name"
        );

    const precio =
        document.getElementById(
            "modal-price"
        );

    const descripcion =
        document.getElementById(
            "modal-description"
        );

    const boton =
        document.getElementById(
            "modal-add-button"
        );


    const stock =
        Number(
            producto.stock || 0
        );


    imagen.src =
        producto.image ||
        producto.imageUrl ||
        "images/Logo Urban.png";


    imagen.alt =
        producto.name ||
        "Producto";


    imagen.onerror =
        function () {
            this.src =
                "images/Logo Urban.png";
        };


    categoria.textContent =
        producto.category ||
        "General";


    nombre.textContent =
        producto.name ||
        "Producto";


    precio.textContent =
        formatearPrecio(
            producto.price
        );


    descripcion.textContent =
        producto.description ||
        "Producto Urban Society.";


    boton.disabled =
        stock <= 0;


    boton.textContent =
        stock > 0
            ? "Agregar al carrito"
            : "Agotado";


    boton.onclick =
        function () {

            agregarAlCarrito(
                producto.objectId
            );

            cerrarModalProducto();

        };


    modal.classList.add(
        "active"
    );

}


function cerrarModalProducto() {

    const modal =
        document.getElementById(
            "product-modal"
        );

    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* ==========================================
   CARRITO
========================================== */

function cargarCarritoLocal() {

    try {

        const guardado =
            localStorage.getItem(
                "urbanSocietyCart"
            );


        carritoUrban =
            guardado
                ? JSON.parse(guardado)
                : [];


        if (
            !Array.isArray(
                carritoUrban
            )
        ) {

            carritoUrban = [];

        }

    } catch (error) {

        console.error(
            "Error leyendo carrito:",
            error
        );

        carritoUrban = [];

    }

}


function guardarCarritoLocal() {

    localStorage.setItem(
        "urbanSocietyCart",
        JSON.stringify(
            carritoUrban
        )
    );

}


function agregarAlCarrito(
    id
) {

    const producto =
        productosUrban.find(
            item =>
                item.objectId === id
        );


    if (!producto) {

        mostrarNotificacion(
            "Producto no encontrado."
        );

        return;

    }


    const stock =
        Number(
            producto.stock || 0
        );


    if (stock <= 0) {

        mostrarNotificacion(
            "Producto agotado."
        );

        return;

    }


    const existente =
        carritoUrban.find(
            item =>
                item.id === id
        );


    if (existente) {

        if (
            existente.quantity >=
            stock
        ) {

            mostrarNotificacion(
                "No hay más unidades disponibles."
            );

            return;

        }


        existente.quantity++;

    } else {

        carritoUrban.push({

            id: id,

            quantity: 1

        });

    }


    guardarCarritoLocal();

    actualizarCarritoUI();


    mostrarNotificacion(
        "Producto agregado al carrito."
    );

}


function cambiarCantidad(
    id,
    cantidad
) {

    const producto =
        productosUrban.find(
            item =>
                item.objectId === id
        );


    const item =
        carritoUrban.find(
            item =>
                item.id === id
        );


    if (!producto || !item) return;


    const stock =
        Number(
            producto.stock || 0
        );


    if (cantidad <= 0) {

        eliminarDelCarrito(
            id
        );

        return;

    }


    if (cantidad > stock) {

        mostrarNotificacion(
            `Solo hay ${stock} disponibles.`
        );

        return;

    }


    item.quantity =
        cantidad;


    guardarCarritoLocal();

    actualizarCarritoUI();

    mostrarCarrito();

}


function eliminarDelCarrito(
    id
) {

    carritoUrban =
        carritoUrban.filter(
            item =>
                item.id !== id
        );


    guardarCarritoLocal();

    actualizarCarritoUI();

    mostrarCarrito();

}


function actualizarCarritoUI() {

    const contador =
        document.getElementById(
            "cart-count"
        );

    if (!contador) return;


    const cantidad =
        carritoUrban.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );


    contador.textContent =
        cantidad;

}


/* ==========================================
   MOSTRAR CARRITO
========================================== */

function abrirCarrito() {

    mostrarCarrito();


    const modal =
        document.getElementById(
            "cart-modal"
        );


    if (modal) {

        modal.classList.add(
            "active"
        );

    }

}


function cerrarCarrito() {

    const modal =
        document.getElementById(
            "cart-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


function mostrarCarrito() {

    const container =
        document.getElementById(
            "cart-items"
        );


    const totalElement =
        document.getElementById(
            "cart-total"
        );


    if (!container) return;


    if (!carritoUrban.length) {

        container.innerHTML = `

            <div class="empty-cart">

                <h3>
                    Tu carrito está vacío
                </h3>

                <p>
                    Agrega algunos productos.
                </p>

            </div>

        `;


        if (totalElement) {

            totalElement.textContent =
                "$0.00 MXN";

        }


        return;

    }


    let total = 0;


    const html =
        carritoUrban.map(
            item => {

                const producto =
                    productosUrban.find(
                        p =>
                            p.objectId ===
                            item.id
                    );


                if (!producto) {

                    return "";

                }


                const precio =
                    Number(
                        producto.price || 0
                    );


                const cantidad =
                    Number(
                        item.quantity || 0
                    );


                const subtotal =
                    precio *
                    cantidad;


                total +=
                    subtotal;


                return `

                    <div
                        class="cart-item"
                    >

                        <img
                            src="${
                                escaparHTML(
                                    producto.image ||
                                    producto.imageUrl ||
                                    "images/Logo Urban.png"
                                )
                            }"
                            alt="${
                                escaparHTML(
                                    producto.name ||
                                    "Producto"
                                )
                            }"
                            onerror="
                                this.src='images/Logo Urban.png'
                            "
                        >


                        <div
                            class="cart-item-info"
                        >

                            <strong>
                                ${
                                    escaparHTML(
                                        producto.name ||
                                        "Producto"
                                    )
                                }
                            </strong>


                            <span>
                                ${
                                    formatearPrecio(
                                        precio
                                    )
                                }
                            </span>


                            <div
                                class="quantity-controls"
                            >

                                <button
                                    type="button"
                                    onclick="
                                        cambiarCantidad(
                                            '${item.id}',
                                            ${cantidad - 1}
                                        )
                                    "
                                >
                                    −
                                </button>


                                <strong>
                                    ${cantidad}
                                </strong>


                                <button
                                    type="button"
                                    onclick="
                                        cambiarCantidad(
                                            '${item.id}',
                                            ${cantidad + 1}
                                        )
                                    "
                                >
                                    +
                                </button>

                            </div>

                        </div>


                        <div>

                            <strong>
                                ${
                                    formatearPrecio(
                                        subtotal
                                    )
                                }
                            </strong>


                            <button
                                type="button"
                                class="remove-cart"
                                onclick="
                                    eliminarDelCarrito(
                                        '${item.id}'
                                    )
                                "
                                title="Eliminar"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");


    container.innerHTML =
        html;


    if (totalElement) {

        totalElement.textContent =
            formatearPrecio(
                total
            );

    }

}


/* ==========================================
   TOTAL
========================================== */

function obtenerTotalCarrito() {

    return carritoUrban.reduce(
        (
            total,
            item
        ) => {

            const producto =
                productosUrban.find(
                    p =>
                        p.objectId ===
                        item.id
                );


            if (!producto) {

                return total;

            }


            return (
                total +
                (
                    Number(
                        producto.price || 0
                    ) *
                    Number(
                        item.quantity || 0
                    )
                )
            );

        },
        0
    );

}


/* ==========================================
   CHECKOUT
========================================== */

function iniciarCheckout() {

    if (!carritoUrban.length) {

        mostrarNotificacion(
            "Tu carrito está vacío."
        );

        return;

    }


    const checkoutModal =
        document.getElementById(
            "checkout-modal"
        );


    if (!checkoutModal) return;


    /*
       Si está conectado,
       rellenamos los datos.
    */

    if (
        typeof usuarioActual !==
            "undefined" &&
        usuarioActual
    ) {

        const nombre =
            document.getElementById(
                "checkout-name"
            );

        const email =
            document.getElementById(
                "checkout-email"
            );

        const phone =
            document.getElementById(
                "checkout-phone"
            );


        if (nombre) {

            nombre.value =
                usuarioActual.name ||
                "";

        }


        if (email) {

            email.value =
                usuarioActual.email ||
                "";

        }


        if (phone) {

            phone.value =
                usuarioActual.phone ||
                "";

        }

    }


    checkoutModal.classList.add(
        "active"
    );


    cerrarCarrito();

}


function cerrarCheckout() {

    const modal =
        document.getElementById(
            "checkout-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* ==========================================
   CREAR PEDIDO
========================================== */

async function crearPedido(
    event
) {

    event.preventDefault();


    if (!carritoUrban.length) {

        alert(
            "El carrito está vacío."
        );

        return;

    }


    const nombre =
        document.getElementById(
            "checkout-name"
        )?.value.trim();


    const email =
        document.getElementById(
            "checkout-email"
        )?.value.trim();


    const phone =
        document.getElementById(
            "checkout-phone"
        )?.value.trim();


    const address =
        document.getElementById(
            "checkout-address"
        )?.value.trim();


    const payment =
        document.getElementById(
            "checkout-payment"
        )?.value;


    if (
        !nombre ||
        !email ||
        !phone ||
        !address ||
        !payment
    ) {

        alert(
            "Completa todos los datos del pedido."
        );

        return;

    }


    try {

        /*
           Volvemos a validar productos
           antes de guardar el pedido.
        */

        const productosPedido = [];


        for (
            const item
            of carritoUrban
        ) {

            const producto =
                productosUrban.find(
                    p =>
                        p.objectId ===
                        item.id
                );


            if (!producto) {

                throw new Error(
                    "Uno de los productos ya no existe."
                );

            }


            const stock =
                Number(
                    producto.stock || 0
                );


            if (
                item.quantity >
                stock
            ) {

                throw new Error(
                    `No hay suficiente stock de ${producto.name}.`
                );

            }


            productosPedido.push({

                productId:
                    producto.objectId,

                name:
                    producto.name,

                price:
                    Number(
                        producto.price || 0
                    ),

                quantity:
                    Number(
                        item.quantity || 0
                    ),

                subtotal:
                    Number(
                        producto.price || 0
                    ) *
                    Number(
                        item.quantity || 0
                    )

            });

        }


        const total =
            obtenerTotalCarrito();


        /*
           Objeto del pedido.
        */

        const pedido = {

            customerName:
                nombre,

            customerEmail:
                email,

            customerPhone:
                phone,

            address:
                address,

            paymentMethod:
                payment,

            products:
                JSON.stringify(
                    productosPedido
                ),

            total:
                total,

            status:
                "Pendiente",

            userId:
                (
                    typeof usuarioActual !==
                    "undefined" &&
                    usuarioActual
                )
                    ? usuarioActual.objectId
                    : null

        };


        const guardado =
            await Backendless.Data
                .of(ORDERS_TABLE)
                .save(
                    pedido
                );


        /*
           Actualizar stock.
        */

        for (
            const item
            of carritoUrban
        ) {

            const producto =
                productosUrban.find(
                    p =>
                        p.objectId ===
                        item.id
                );


            if (!producto) continue;


            const nuevoStock =
                Math.max(
                    0,
                    Number(
                        producto.stock || 0
                    ) -
                    Number(
                        item.quantity || 0
                    )
                );


            await Backendless.Data
                .of(
                    PRODUCTS_TABLE
                )
                .save({

                    objectId:
                        producto.objectId,

                    stock:
                        nuevoStock

                });

        }


        carritoUrban = [];


        guardarCarritoLocal();

        actualizarCarritoUI();


        cerrarCheckout();


        const form =
            document.getElementById(
                "checkout-form"
            );


        if (form) {

            form.reset();

        }


        alert(
            "¡Pedido recibido correctamente!\n\n" +
            "Número de pedido: " +
            (
                guardado.objectId ||
                "Generado"
            )
        );


        await cargarProductos();


    } catch (error) {

        console.error(
            "Error creando pedido:",
            error
        );


        alert(
            "No se pudo realizar el pedido.\n\n" +
            (
                error.message ||
                "Error desconocido."
            )
        );

    }

}


/* ==========================================
   BUSCADOR
========================================== */

function configurarBuscador() {

    const search =
        document.getElementById(
            "search-input"
        );


    const category =
        document.getElementById(
            "category-filter"
        );


    if (search) {

        search.addEventListener(
            "input",
            filtrarProductos
        );

    }


    if (category) {

        category.addEventListener(
            "change",
            filtrarProductos
        );

    }

}


function filtrarProductos() {

    const search =
        (
            document.getElementById(
                "search-input"
            )?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const category =
        document.getElementById(
            "category-filter"
        )?.value ||
        "";


    const filtrados =
        productosUrban.filter(
            producto => {

                const nombre =
                    String(
                        producto.name ||
                        ""
                    ).toLowerCase();


                const descripcion =
                    String(
                        producto.description ||
                        ""
                    ).toLowerCase();


                const categoria =
                    String(
                        producto.category ||
                        ""
                    );


                const coincideTexto =
                    !search ||
                    nombre.includes(
                        search
                    ) ||
                    descripcion.includes(
                        search
                    );


                const coincideCategoria =
                    !category ||
                    categoria ===
                    category;


                return (
                    coincideTexto &&
                    coincideCategoria
                );

            }
        );


    mostrarProductos(
        filtrados
    );

}


/* ==========================================
   UTILIDADES
========================================== */

function formatearPrecio(
    precio
) {

    return new Intl.NumberFormat(
        "es-MX",
        {
            style: "currency",
            currency: "MXN"
        }
    ).format(
        Number(
            precio || 0
        )
    );

}


function escaparHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function mostrarNotificacion(
    mensaje
) {

    let notification =
        document.querySelector(
            ".urban-notification"
        );


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );


        notification.className =
            "urban-notification";


        document.body.appendChild(
            notification
        );

    }


    notification.textContent =
        mensaje;


    notification.classList.add(
        "show"
    );


    setTimeout(
        () => {

            notification.classList.remove(
                "show"
            );

        },
        2500
    );

}


/* ==========================================
   CLIC FUERA DE MODALES
========================================== */

document.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {

            event.target.classList.remove(
                "active"
            );

        }

    }
);


/* ==========================================
   FORMULARIO CHECKOUT
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const form =
            document.getElementById(
                "checkout-form"
            );


        if (form) {

            form.addEventListener(
                "submit",
                crearPedido
            );

        }

    }
);


/* ==========================================
   EXPORTAR
========================================== */

window.cargarProductos =
    cargarProductos;

window.abrirProducto =
    abrirProducto;

window.cerrarModalProducto =
    cerrarModalProducto;

window.agregarAlCarrito =
    agregarAlCarrito;

window.abrirCarrito =
    abrirCarrito;

window.cerrarCarrito =
    cerrarCarrito;

window.cambiarCantidad =
    cambiarCantidad;

window.eliminarDelCarrito =
    eliminarDelCarrito;

window.iniciarCheckout =
    iniciarCheckout;

window.cerrarCheckout =
    cerrarCheckout;

window.mostrarCarrito =
    mostrarCarrito;
