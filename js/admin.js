/* =========================================================
   URBAN SOCIETY
   ADMIN.JS
   Panel del propietario
========================================================= */

const ADMIN_PRODUCTS_TABLE = "Products";
const ADMIN_ORDERS_TABLE = "Orders";

let adminProducts = [];
let adminOrders = [];

function adminEl(id) {
  return document.getElementById(id);
}

function escaparAdmin(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatearAdminPrecio(precio) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(precio || 0));
}

function mostrarErrorAdmin(mensaje) {
  console.error(mensaje);
}

function mostrarNotificacionAdmin(mensaje) {
  if (typeof mostrarNotificacion === "function") {
    mostrarNotificacion(mensaje);
  } else {
    alert(mensaje);
  }
}

async function cargarProductosAdmin() {
  const container = adminEl("admin-products");
  if (container) container.innerHTML = '<div class="empty-products">Cargando productos...</div>';

  try {
    const query = Backendless.DataQueryBuilder.create().setSortBy(["created DESC"]);
    adminProducts = await Backendless.Data.of(ADMIN_PRODUCTS_TABLE).find(query) || [];
    mostrarProductosAdmin(adminProducts);
    actualizarEstadisticasAdmin();
  } catch (error) {
    console.error("Error cargando productos:", error);
    if (container) container.innerHTML = '<div class="empty-products">No se pudieron cargar los productos.</div>';
  }
}

function mostrarProductosAdmin(productos) {
  const container = adminEl("admin-products");
  if (!container) return;

  if (!productos.length) {
    container.innerHTML = '<div class="empty-products"><h3>No hay productos</h3><p>Agrega tu primer producto.</p></div>';
    return;
  }

  container.innerHTML = productos.map(tarjetaProductoAdmin).join("");
}

function tarjetaProductoAdmin(producto) {
  const id = escaparAdmin(producto.objectId || "");
  const nombre = escaparAdmin(producto.name || "Sin nombre");
  const categoria = escaparAdmin(producto.category || "General");
  const precio = Number(producto.price || 0);
  const stock = Number(producto.stock || 0);
  const imagen = escaparAdmin(producto.image || producto.imageUrl || "images/Logo Urban.png");

  return `
    <div class="admin-product-card">
      <img src="${imagen}" alt="${nombre}" onerror="this.src='images/Logo Urban.png'">
      <div class="admin-product-info">
        <span>${categoria}</span>
        <h3>${nombre}</h3>
        <strong>${formatearAdminPrecio(precio)}</strong>
        <p>Stock: <b>${stock}</b></p>
        <div class="admin-product-actions">
          <button type="button" onclick="editarProductoAdmin('${id}')">✏️ Editar</button>
          <button type="button" onclick="eliminarProductoAdmin('${id}')">🗑️ Eliminar</button>
        </div>
      </div>
    </div>
  `;
}

function mostrarVistaPrevia(event) {
  const archivo = event.target.files?.[0];
  const preview = adminEl("image-preview");
  const container = adminEl("image-preview-container");
  const status = adminEl("image-upload-status");

  if (!archivo) {
    if (container) container.style.display = "none";
    return;
  }

  if (!archivo.type.startsWith("image/")) {
    alert("Selecciona una imagen válida.");
    event.target.value = "";
    return;
  }

  if (archivo.size > 5 * 1024 * 1024) {
    alert("La imagen no puede superar 5 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (preview) preview.src = reader.result;
    if (container) container.style.display = "block";
  };
  reader.readAsDataURL(archivo);

  if (status) status.textContent = archivo.name;
}

async function subirImagenProducto() {
  const input = adminEl("product-image-file");
  const archivo = input?.files?.[0];
  if (!archivo) return null;

  const status = adminEl("image-upload-status");
  if (status) status.textContent = "Subiendo fotografía...";

  const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ruta = `products/${Date.now()}_${nombreSeguro}`;

  try {
    const resultado = await Backendless.Files.upload(archivo, ruta, true);
    const url = resultado?.fileURL || resultado?.url;
    if (!url) throw new Error("Backendless no devolvió la URL de la imagen.");
    if (status) status.textContent = "✓ Fotografía subida correctamente.";
    return url;
  } catch (error) {
    if (status) status.textContent = "Error al subir la fotografía.";
    throw error;
  }
}

function limpiarCamposVisualesProducto() {
  if (adminEl("product-id")) adminEl("product-id").value = "";
  if (adminEl("product-image")) adminEl("product-image").value = "";

  const previewContainer = adminEl("image-preview-container");
  if (previewContainer) previewContainer.style.display = "none";

  const preview = adminEl("image-preview");
  if (preview) preview.removeAttribute("src");

  const status = adminEl("image-upload-status");
  if (status) status.textContent = "Selecciona una fotografía desde tu computadora.";

  const submit = adminEl("product-form")?.querySelector("button[type='submit']");
  if (submit) submit.textContent = "Agregar producto";
}

function limpiarFormularioProducto() {
  const form = adminEl("product-form");
  if (form) form.reset();
  limpiarCamposVisualesProducto();
}

async function guardarProductoAdmin(event) {
  event.preventDefault();

  const objectId = adminEl("product-id")?.value.trim() || "";
  const name = adminEl("product-name")?.value.trim() || "";
  const price = Number(adminEl("product-price")?.value || 0);
  const category = adminEl("product-category")?.value.trim() || "Otros";
  const stock = Number(adminEl("product-stock")?.value || 0);
  const description = adminEl("product-description")?.value.trim() || "";
  let image = adminEl("product-image")?.value.trim() || "";

  if (!name) return alert("Escribe el nombre del producto.");
  if (!Number.isFinite(price) || price < 0) return alert("Escribe un precio válido.");
  if (!Number.isInteger(stock) || stock < 0) return alert("Escribe un stock válido.");

  const submit = event.target.querySelector("button[type='submit']");
  if (submit) {
    submit.disabled = true;
    submit.textContent = objectId ? "Guardando cambios..." : "Agregando...";
  }

  try {
    if (adminEl("product-image-file")?.files?.[0]) {
      image = await subirImagenProducto();
    }

    const producto = { name, price, category, stock, image, description };
    if (objectId) producto.objectId = objectId;

    await Backendless.Data.of(ADMIN_PRODUCTS_TABLE).save(producto);
    mostrarNotificacionAdmin(objectId ? "Producto actualizado." : "Producto agregado.");
    limpiarFormularioProducto();
    await cargarProductosAdmin();
  } catch (error) {
    console.error("Error guardando producto:", error);
    alert("No se pudo guardar el producto.\n\n" + (error.message || "Error desconocido."));
  } finally {
    if (submit) submit.disabled = false;
  }
}

function editarProductoAdmin(id) {
  const producto = adminProducts.find(item => item.objectId === id);
  if (!producto) return alert("Producto no encontrado.");

  adminEl("product-id").value = producto.objectId || "";
  adminEl("product-name").value = producto.name || "";
  adminEl("product-price").value = producto.price ?? 0;
  adminEl("product-category").value = producto.category || "";
  adminEl("product-stock").value = producto.stock ?? 0;
  adminEl("product-image").value = producto.image || producto.imageUrl || "";
  adminEl("product-description").value = producto.description || "";

  const fileInput = adminEl("product-image-file");
  if (fileInput) fileInput.value = "";

  const preview = adminEl("image-preview");
  const previewContainer = adminEl("image-preview-container");
  const actual = producto.image || producto.imageUrl || "";
  if (actual && preview && previewContainer) {
    preview.src = actual;
    previewContainer.style.display = "block";
  }

  const submit = adminEl("product-form")?.querySelector("button[type='submit']");
  if (submit) submit.textContent = "Guardar cambios";

  adminEl("product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function eliminarProductoAdmin(id) {
  const producto = adminProducts.find(item => item.objectId === id);
  if (!producto) return;

  if (!confirm(`¿Eliminar "${producto.name || "este producto"}"?`)) return;

  try {
    await Backendless.Data.of(ADMIN_PRODUCTS_TABLE).remove(id);
    mostrarNotificacionAdmin("Producto eliminado.");
    await cargarProductosAdmin();
  } catch (error) {
    console.error("Error eliminando producto:", error);
    alert("No se pudo eliminar el producto.\n\n" + (error.message || "Error desconocido."));
  }
}

async function cargarPedidosAdmin() {
  const container = adminEl("admin-orders");
  if (container) container.innerHTML = '<div class="empty-products">Cargando pedidos...</div>';

  try {
    const query = Backendless.DataQueryBuilder.create().setSortBy(["created DESC"]);
    adminOrders = await Backendless.Data.of(ADMIN_ORDERS_TABLE).find(query) || [];
    mostrarPedidosAdmin(adminOrders);
    actualizarEstadisticasAdmin();
  } catch (error) {
    console.error("Error cargando pedidos:", error);
    if (container) container.innerHTML = '<div class="empty-products">No se pudieron cargar los pedidos.</div>';
  }
}

function mostrarPedidosAdmin(pedidos) {
  const container = adminEl("admin-orders");
  if (!container) return;

  if (!pedidos.length) {
    container.innerHTML = '<div class="empty-products"><h3>No hay pedidos</h3><p>Los nuevos pedidos aparecerán aquí.</p></div>';
    return;
  }

  container.innerHTML = pedidos.map(tarjetaPedidoAdmin).join("");
}

function tarjetaPedidoAdmin(pedido) {
  const id = escaparAdmin(pedido.objectId || "");
  const nombre = escaparAdmin(pedido.customerName || "Cliente");
  const email = escaparAdmin(pedido.customerEmail || "");
  const telefono = escaparAdmin(pedido.customerPhone || "");
  const direccion = escaparAdmin(pedido.address || "");
  const metodo = escaparAdmin(pedido.paymentMethod || "No especificado");
  const estado = String(pedido.status || "Pendiente");
  const total = Number(pedido.total || 0);
  const estados = ["Pendiente", "Confirmado", "Preparando", "Enviado", "Entregado", "Cancelado"];

  return `
    <div class="admin-order-card">
      <div class="admin-order-header"><strong>Pedido #${id}</strong><span class="order-status">${escaparAdmin(estado)}</span></div>
      <div class="admin-order-body">
        <p><b>Cliente:</b> ${nombre}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Teléfono:</b> ${telefono}</p>
        <p><b>Dirección:</b> ${direccion}</p>
        <p><b>Pago:</b> ${metodo}</p>
        <p><b>Total:</b> ${formatearAdminPrecio(total)}</p>
        <label>Estado del pedido</label>
        <select onchange="cambiarEstadoPedido('${id}', this.value)">
          ${estados.map(item => `<option value="${item}" ${item === estado ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </div>
    </div>
  `;
}

async function cambiarEstadoPedido(id, estado) {
  try {
    await Backendless.Data.of(ADMIN_ORDERS_TABLE).save({ objectId: id, status: estado });
    mostrarNotificacionAdmin("Estado actualizado.");
    await cargarPedidosAdmin();
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    alert("No se pudo actualizar el pedido.");
  }
}

function actualizarEstadisticasAdmin() {
  const productosCount = adminEl("admin-products-count");
  const pedidosCount = adminEl("admin-orders-count");
  const ventasTotal = adminEl("admin-sales-total");

  if (productosCount) productosCount.textContent = adminProducts.length;
  if (pedidosCount) pedidosCount.textContent = adminOrders.length;

  if (ventasTotal) {
    const total = adminOrders.reduce((suma, pedido) => {
      return pedido.status === "Cancelado" ? suma : suma + Number(pedido.total || 0);
    }, 0);
    ventasTotal.textContent = formatearAdminPrecio(total);
  }
}

async function iniciarPanelAdmin() {
  await Promise.all([
    cargarProductosAdmin(),
    cargarPedidosAdmin()
  ]);
  actualizarEstadisticasAdmin();
}

document.addEventListener("DOMContentLoaded", async () => {
  const autorizado = await verificarOwner();
  if (!autorizado) return;

  const form = adminEl("product-form");
  form?.addEventListener("submit", guardarProductoAdmin);
  form?.addEventListener("reset", () => setTimeout(limpiarCamposVisualesProducto, 0));
  adminEl("product-image-file")?.addEventListener("change", mostrarVistaPrevia);

  await iniciarPanelAdmin();
});

window.cargarProductosAdmin = cargarProductosAdmin;
window.cargarPedidosAdmin = cargarPedidosAdmin;
window.editarProductoAdmin = editarProductoAdmin;
window.eliminarProductoAdmin = eliminarProductoAdmin;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.actualizarEstadisticasAdmin = actualizarEstadisticasAdmin;
