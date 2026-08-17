/* ==========================================
   URBAN SOCIETY
   ADMIN.JS
   PANEL DEL PROPIETARIO
========================================== */

const ADMIN_PRODUCTS_TABLE = "Products";
const ADMIN_ORDERS_TABLE = "Orders";

let adminProducts = [];
let adminOrders = [];


/* ==========================================
   INICIO
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const autorizado =
            await verificarOwner();

        if (!autorizado) {
            return;
        }

        iniciarPanelAdmin();

    }
);


/* ==========================================
   INICIAR PANEL
========================================== */

async function iniciarPanelAdmin() {

    console.log(
        "Panel de propietario iniciado."
    );

    await cargarProductosAdmin();

    await cargarPedidosAdmin();

    configurarFormularioProducto();

}


/* ==========================================
   PRODUCTOS
========================================== */

async function cargarProductosAdmin() {

    try {

        const query =
            Backendless.DataQueryBuilder
                .create()
                .setSortBy([
                    "created DESC"
                ]);


        const resultado =
            await Backendless.Data
                .of(
                    ADMIN_PRODUCTS_TABLE
                )
                .find(
                    query
                );


        adminProducts =
            resultado || [];

            actualizarEstadisticasAdmin();

        mostrarProductosAdmin(
            adminProducts
        );


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

        mostrarErrorAdmin(
            "No se pudieron cargar los productos."
        );

    }

}


/* ==========================================
   MOSTRAR PRODUCTOS
========================================== */

function mostrarProductosAdmin(
    productos
) {

    const container =
        document.getElementById(
            "admin-products"
        );


    if (!container) {
        return;
    }


    if (!productos.length) {

        container.innerHTML = `

            <div class="empty-products">

                <h3>
                    No hay productos
                </h3>

                <p>
                    Agrega tu primer producto.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        productos
            .map(
                producto =>
                    tarjetaProductoAdmin(
                        producto
                    )
            )
            .join("");

}


/* ==========================================
   TARJETA ADMIN
========================================== */

function tarjetaProductoAdmin(
    producto
) {

    const id =
        escaparAdmin(
            producto.objectId
        );


    const nombre =
        escaparAdmin(
            producto.name ||
            "Sin nombre"
        );


    const categoria =
        escaparAdmin(
            producto.category ||
            "General"
        );


    const precio =
        Number(
            producto.price || 0
        );


    const stock =
        Number(
            producto.stock || 0
        );


    const imagen =
        producto.image ||
        producto.imageUrl ||
        "images/Logo Urban.png";


    return `

        <div class="admin-product-card">


            <img
                src="${escaparAdmin(imagen)}"
                alt="${nombre}"
                onerror="
                    this.src='images/Logo Urban.png'
                "
            >


            <div
                class="admin-product-info"
            >

                <span>
                    ${categoria}
                </span>


                <h3>
                    ${nombre}
                </h3>


                <strong>
                    ${formatearAdminPrecio(precio)}
                </strong>


                <p>
                    Stock:
                    <b>
                        ${stock}
                    </b>
                </p>


                <div
                    class="admin-product-actions"
                >

                    <button
                        type="button"
                        onclick="
                            editarProductoAdmin(
                                '${id}'
                            )
                        "
                    >
                        ✏️ Editar
                    </button>


                    <button
                        type="button"
                        onclick="
                            eliminarProductoAdmin(
                                '${id}'
                            )
                        "
                    >
                        🗑️ Eliminar
                    </button>

                </div>

            </div>

        </div>

    `;

}


/* ==========================================
   AGREGAR PRODUCTO
========================================== */

function configurarFormularioProducto() {

    const form =
        document.getElementById(
            "product-form"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        guardarProductoAdmin
    );


    const fileInput =
        document.getElementById(
            "product-image-file"
        );


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            mostrarVistaPrevia
        );

    }

}

function mostrarVistaPrevia(event) {

    const archivo =
        event.target.files[0];


    const preview =
        document.getElementById(
            "image-preview"
        );


    const container =
        document.getElementById(
            "image-preview-container"
        );


    const status =
        document.getElementById(
            "image-upload-status"
        );


    if (!archivo) {

        if (container) {
            container.style.display =
                "none";
        }

        return;

    }


    if (!archivo.type.startsWith("image/")) {

        alert(
            "Selecciona una imagen válida."
        );

        event.target.value = "";

        return;

    }


    if (
        archivo.size >
        5 * 1024 * 1024
    ) {

        alert(
            "La imagen no puede superar 5 MB."
        );

        event.target.value = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function () {

            if (preview) {

                preview.src =
                    reader.result;

            }


            if (container) {

                container.style.display =
                    "block";

            }

        };


    reader.readAsDataURL(
        archivo
    );


    if (status) {

        status.textContent =
            archivo.name;

    }

}

async function subirImagenProducto() {

    const input =
        document.getElementById(
            "product-image-file"
        );


    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {

        return null;

    }


    const archivo =
        input.files[0];


    const status =
        document.getElementById(
            "image-upload-status"
        );


    try {

        if (status) {

            status.textContent =
                "Subiendo fotografía...";

        }


        const timestamp =
            Date.now();


        const nombreSeguro =
            archivo.name
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


        const nombreArchivo =
            `products/${timestamp}_${nombreSeguro}`;


        const resultado =
            await Backendless.Files
                .upload(
                    archivo,
                    nombreArchivo,
                    true
                );


        console.log(
            "Imagen subida:",
            resultado
        );


        const url =
            resultado.fileURL ||
            resultado.url;


        if (!url) {

            throw new Error(
                "Backendless no devolvió la URL de la imagen."
            );

        }


        if (status) {

            status.textContent =
                "✓ Fotografía subida correctamente.";

        }


        return url;


    } catch (error) {

        console.error(
            "Error subiendo imagen:",
            error
        );


        if (status) {

            status.textContent =
                "Error al subir la fotografía.";

        }


        throw error;

    }

}
/* ==========================================
   GUARDAR PRODUCTO
========================================== */

async function guardarProductoAdmin(
    event
) {

    event.preventDefault();


    const form =
        event.target;


    const objectId =
        document.getElementById(
            "product-id"
        )?.value.trim();


    const name =
        document.getElementById(
            "product-name"
        )?.value.trim();


    const price =
        Number(
            document.getElementById(
                "product-price"
            )?.value || 0
        );


    const category =
        document.getElementById(
            "product-category"
        )?.value.trim();


    const stock =
        Number(
            document.getElementById(
                "product-stock"
            )?.value || 0
        );


   let image =
    document.getElementById(
        "product-image"
    )?.value.trim() || "";


    const description =
        document.getElementById(
            "product-description"
        )?.value.trim();


    if (!name) {

        alert(
            "Escribe el nombre del producto."
        );

        return;

    }


    if (price < 0) {

        alert(
            "El precio no puede ser negativo."
        );

        return;

    }


    if (stock < 0) {

        alert(
            "El stock no puede ser negativo."
        );

        return;

    }


    try {

    const archivoImagen =
    document.getElementById(
        "product-image-file"
    )?.files?.[0];


if (archivoImagen) {

    try {

        image =
            await subirImagenProducto();

    } catch (error) {

        alert(
            "No se pudo subir la fotografía."
        );

        return;

    }

}

        const producto = {

            name:
                name,

            price:
                price,

            category:
                category ||
                "Otros",

            stock:
                stock,

            image:
                image,

            description:
                description

        };


        if (objectId) {

            producto.objectId =
                objectId;

        }


        const guardado =
            await Backendless.Data
                .of(
                    ADMIN_PRODUCTS_TABLE
                )
                .save(
                    producto
                );


        console.log(
            "Producto guardado:",
            guardado
        );


        alert(
            objectId
                ? "Producto actualizado correctamente."
                : "Producto agregado correctamente."
        );


        form.reset();


        const idInput =
            document.getElementById(
                "product-id"
            );


        if (idInput) {

            idInput.value = "";

        }


        const submit =
            form.querySelector(
                "button[type='submit']"
            );


        if (submit) {

            submit.textContent =
                "Agregar producto";

        }


        await cargarProductosAdmin();


    } catch (error) {

        console.error(
            "Error guardando producto:",
            error
        );


        alert(
            "No se pudo guardar el producto.\n\n" +
            (
                error.message ||
                "Error desconocido."
            )
        );

    }

}


/* ==========================================
   EDITAR PRODUCTO
========================================== */

function editarProductoAdmin(
    id
) {

    const producto =
        adminProducts.find(
            item =>
                item.objectId === id
        );


    if (!producto) {

        alert(
            "Producto no encontrado."
        );

        return;

    }


    const idInput =
        document.getElementById(
            "product-id"
        );


    const name =
        document.getElementById(
            "product-name"
        );


    const price =
        document.getElementById(
            "product-price"
        );


    const category =
        document.getElementById(
            "product-category"
        );


    const stock =
        document.getElementById(
            "product-stock"
        );


    const image =
        document.getElementById(
            "product-image"
        );


    const description =
        document.getElementById(
            "product-description"
        );


    if (idInput) {

        idInput.value =
            producto.objectId || "";

    }


    if (name) {

        name.value =
            producto.name || "";

    }


    if (price) {

        price.value =
            producto.price || 0;

    }


    if (category) {

        category.value =
            producto.category || "";

    }


    if (stock) {

        stock.value =
            producto.stock || 0;

    }


    if (image) {

        image.value =
            producto.image ||
            producto.imageUrl ||
            "";

    }

    const fileInput =
    document.getElementById(
        "product-image-file"
    );


if (fileInput) {

    fileInput.value = "";

}

    if (description) {

        description.value =
            producto.description || "";

    }


    const submit =
        document.querySelector(
            "#product-form button[type='submit']"
        );


    if (submit) {

        submit.textContent =
            "Guardar cambios";

    }


    document
        .getElementById(
            "product-form"
        )
        ?.scrollIntoView({
            behavior: "smooth"
        });

}


/* ==========================================
   ELIMINAR PRODUCTO
========================================== */

async function eliminarProductoAdmin(
    id
) {

    const producto =
        adminProducts.find(
            item =>
                item.objectId === id
        );


    if (!producto) {
        return;
    }


    const confirmar =
        confirm(
            `¿Eliminar "${producto.name}"?`
        );


    if (!confirmar) {
        return;
    }


    try {

        await Backendless.Data
            .of(
                ADMIN_PRODUCTS_TABLE
            )
            .remove(
                id
            );


        alert(
            "Producto eliminado correctamente."
        );


        await cargarProductosAdmin();


    } catch (error) {

        console.error(
            "Error eliminando producto:",
            error
        );


        alert(
            "No se pudo eliminar el producto.\n\n" +
            (
                error.message ||
                "Error desconocido."
            )
        );

    }

}


/* ==========================================
   PEDIDOS
========================================== */

async function cargarPedidosAdmin() {

    try {

        const query =
            Backendless.DataQueryBuilder
                .create()
                .setSortBy([
                    "created DESC"
                ]);


        const resultado =
            await Backendless.Data
                .of(
                    ADMIN_ORDERS_TABLE
                )
                .find(
                    query
                );


        adminOrders =
            resultado || [];


        mostrarPedidosAdmin(
            adminOrders
        );


    } catch (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );


        mostrarErrorAdmin(
            "No se pudieron cargar los pedidos."
        );

    }

}


/* ==========================================
   MOSTRAR PEDIDOS
========================================== */

function mostrarPedidosAdmin(
    pedidos
) {

    const container =
        document.getElementById(
            "admin-orders"
        );


    if (!container) {
        return;
    }


    if (!pedidos.length) {

        container.innerHTML = `

            <div class="empty-products">

                <h3>
                    No hay pedidos
                </h3>

                <p>
                    Los nuevos pedidos aparecerán aquí.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        pedidos
            .map(
                pedido =>
                    tarjetaPedidoAdmin(
                        pedido
                    )
            )
            .join("");

}


/* ==========================================
   TARJETA PEDIDO
========================================== */

function tarjetaPedidoAdmin(
    pedido
) {

    const id =
        escaparAdmin(
            pedido.objectId
        );


    const nombre =
        escaparAdmin(
            pedido.customerName ||
            "Cliente"
        );


    const email =
        escaparAdmin(
            pedido.customerEmail ||
            ""
        );


    const telefono =
        escaparAdmin(
            pedido.customerPhone ||
            ""
        );


    const direccion =
        escaparAdmin(
            pedido.address ||
            ""
        );


    const metodo =
        escaparAdmin(
            pedido.paymentMethod ||
            "No especificado"
        );


    const estado =
        pedido.status ||
        "Pendiente";


    const total =
        Number(
            pedido.total || 0
        );


    return `

        <div class="admin-order-card">


            <div
                class="admin-order-header"
            >

                <strong>
                    Pedido #${id}
                </strong>


                <span
                    class="order-status"
                >
                    ${escaparAdmin(estado)}
                </span>

            </div>


            <div
                class="admin-order-body"
            >

                <p>
                    <b>Cliente:</b>
                    ${nombre}
                </p>


                <p>
                    <b>Email:</b>
                    ${email}
                </p>


                <p>
                    <b>Teléfono:</b>
                    ${telefono}
                </p>


                <p>
                    <b>Dirección:</b>
                    ${direccion}
                </p>


                <p>
                    <b>Pago:</b>
                    ${metodo}
                </p>


                <p>
                    <b>Total:</b>
                    ${formatearAdminPrecio(total)}
                </p>


                <label>
                    Estado del pedido
                </label>


                <select
                    onchange="
                        cambiarEstadoPedido(
                            '${id}',
                            this.value
                        )
                    "
                >

                    <option
                        value="Pendiente"
                        ${
                            estado ===
                            "Pendiente"
                                ? "selected"
                                : ""
                        }
                    >
                        Pendiente
                    </option>


                    <option
                        value="Confirmado"
                        ${
                            estado ===
                            "Confirmado"
                                ? "selected"
                                : ""
                        }
                    >
                        Confirmado
                    </option>


                    <option
                        value="Preparando"
                        ${
                            estado ===
                            "Preparando"
                                ? "selected"
                                : ""
                        }
                    >
                        Preparando
                    </option>


                    <option
                        value="Enviado"
                        ${
                            estado ===
                            "Enviado"
                                ? "selected"
                                : ""
                        }
                    >
                        Enviado
                    </option>


                    <option
                        value="Entregado"
                        ${
                            estado ===
                            "Entregado"
                                ? "selected"
                                : ""
                        }
                    >
                        Entregado
                    </option>


                    <option
                        value="Cancelado"
                        ${
                            estado ===
                            "Cancelado"
                                ? "selected"
                                : ""
                        }
                    >
                        Cancelado
                    </option>

                </select>

            </div>

        </div>

    `;

}


/* ==========================================
   CAMBIAR ESTADO
========================================== */

async function cambiarEstadoPedido(
    id,
    estado
) {

    try {

        await Backendless.Data
            .of(
                ADMIN_ORDERS_TABLE
            )
            .save({

                objectId:
                    id,

                status:
                    estado

            });


        mostrarNotificacionAdmin(
            "Estado actualizado."
        );


        await cargarPedidosAdmin();


    } catch (error) {

        console.error(
            "Error actualizando pedido:",
            error
        );


        alert(
            "No se pudo actualizar el pedido."
        );

    }

}


/* ==========================================
   UTILIDADES
========================================== */

function formatearAdminPrecio(
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


function escaparAdmin(
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


function mostrarErrorAdmin(
    mensaje
) {

    console.error(
        mensaje
    );

}


function mostrarNotificacionAdmin(
    mensaje
) {

    if (
        typeof mostrarNotificacion ===
        "function"
    ) {

        mostrarNotificacion(
            mensaje
        );

        return;

    }


    alert(
        mensaje
    );

}

/* ==========================================
   ESTADÍSTICAS
========================================== */

function actualizarEstadisticasAdmin() {

    const productosCount =
        document.getElementById(
            "admin-products-count"
        );

    const pedidosCount =
        document.getElementById(
            "admin-orders-count"
        );

    const ventasTotal =
        document.getElementById(
            "admin-sales-total"
        );


    if (productosCount) {

        productosCount.textContent =
            adminProducts.length;

    }


    if (pedidosCount) {

        pedidosCount.textContent =
            adminOrders.length;

    }


    if (ventasTotal) {

        const total =
            adminOrders.reduce(
                (
                    suma,
                    pedido
                ) => {

                    if (
                        pedido.status ===
                        "Cancelado"
                    ) {

                        return suma;

                    }


                    return (
                        suma +
                        Number(
                            pedido.total || 0
                        )
                    );

                },
                0
            );


        ventasTotal.textContent =
            formatearAdminPrecio(
                total
            );

    }

}

window.actualizarEstadisticasAdmin =
    actualizarEstadisticasAdmin;

/* ==========================================
   EXPORTAR
========================================== */

window.cargarProductosAdmin =
    cargarProductosAdmin;

window.cargarPedidosAdmin =
    cargarPedidosAdmin;

window.editarProductoAdmin =
    editarProductoAdmin;

window.eliminarProductoAdmin =
    eliminarProductoAdmin;

window.cambiarEstadoPedido =
    cambiarEstadoPedido;