/* =========================================================
   URBAN SOCIETY
   APP.JS
   Catálogo, carrito, buscador y UI de checkout.

   La creación final del pedido vive en checkout-secure.js.
========================================================= */

let productosUrban = [];
let carritoUrban = [];

const PRODUCTS_TABLE = "Products";


document.addEventListener("DOMContentLoaded", async () => {
  cargarCarritoLocal();
  actualizarCarritoUI();
  configurarBuscador();
  await cargarProductos();
});


/* =========================================================
   PRODUCTOS
========================================================= */

async function cargarProductos() {
  const container = document.getElementById("products-grid");
  if (!container) return;

  container.innerHTML = `
    <div class="loading-products">
      <span class="loading-dot"></span>
      <strong>Cargando productos...</strong>
    </div>
  `;

  try {
    const query = Backendless.DataQueryBuilder
      .create()
      .setSortBy(["created DESC"]);

    const encontrados = await Backendless.Data.of(PRODUCTS_TABLE).find(query) || [];

    // Incluso la cuenta propietaria ve el escaparate como lo vería un cliente.
    productosUrban = encontrados.filter(producto => producto.active !== false);

    sincronizarCarritoConCatalogo();
    actualizarMetaCatalogo(productosUrban.length, productosUrban.length);
    mostrarProductos(productosUrban);
  } catch (error) {
    console.error("Error cargando productos:", error);
    actualizarMetaCatalogo(0, 0);
    container.innerHTML = `
      <div class="admin-error">
        <h3>No pudimos cargar el catálogo</h3>
        <p>Comprueba tu conexión e intenta actualizar la página.</p>
        <button type="button" class="btn btn-secondary" onclick="cargarProductos()">REINTENTAR</button>
      </div>
    `;
  }
}

function mostrarProductos(productos, filtrando = false) {
  const container = document.getElementById("products-grid");
  if (!container) return;

  if (!productos.length) {
    container.innerHTML = filtrando
      ? `
        <div class="empty-products">
          <h3>Sin coincidencias</h3>
          <p>Prueba otra búsqueda o cambia la categoría.</p>
        </div>
      `
      : `
        <div class="empty-products">
          <h3>Próximamente</h3>
          <p>Todavía no hay productos disponibles.</p>
        </div>
      `;
    return;
  }

  container.innerHTML = productos.map(crearTarjetaProducto).join("");
}

function crearTarjetaProducto(producto) {
  const id = escaparHTML(producto.objectId || "");
  const nombre = escaparHTML(producto.name || "Producto");
  const categoria = escaparHTML(producto.category || "General");
  const descripcion = escaparHTML(producto.description || "Producto Urban Society.");
  const imagen = escaparHTML(producto.image || producto.imageUrl || "images/Logo Urban.png");
  const precio = Number(producto.price || 0);
  const stock = Number(producto.stock || 0);
  const disponible = stock > 0;
  const tallas = normalizarTallas(producto.sizes);
  const necesitaTalla = tallas.length > 0;

  const stockTexto = stock <= 0
    ? "Agotado"
    : stock <= 5
      ? `Últimas ${stock}`
      : "Disponible";

  const tallasHtml = tallas.length
    ? `<div class="product-sizes" aria-label="Tallas disponibles">
        ${tallas.slice(0, 4).map(talla => `<span>${escaparHTML(talla)}</span>`).join("")}
        ${tallas.length > 4 ? `<span>+${tallas.length - 4}</span>` : ""}
      </div>`
    : "";

  return `
    <article class="product-card">
      <button
        type="button"
        class="product-image-container"
        onclick="abrirProducto('${id}')"
        aria-label="Ver ${nombre}"
      >
        <img
          class="product-image"
          src="${imagen}"
          alt="${nombre}"
          loading="lazy"
          onerror="this.src='images/Logo Urban.png'"
        >
        <span class="product-stock ${disponible ? "available" : "sold-out"}">
          ${stockTexto}
        </span>
      </button>

      <div class="product-info">
        <span class="product-category">${categoria}</span>
        <h3>${nombre}</h3>
        <p class="product-description">${descripcion}</p>
        ${tallasHtml}

        <div class="product-bottom">
          <strong class="product-price">${formatearPrecio(precio)}</strong>
          <button
            type="button"
            class="add-cart-button"
            ${disponible ? "" : "disabled"}
            onclick="${necesitaTalla ? `abrirProducto('${id}')` : `agregarAlCarrito('${id}')`}"
          >
            ${!disponible ? "Agotado" : necesitaTalla ? "Elegir talla" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function abrirProducto(id) {
  const producto = productosUrban.find(item => item.objectId === id && item.active !== false);
  if (!producto) return;

  const modal = document.getElementById("product-modal");
  if (!modal) return;

  const imagen = document.getElementById("modal-image");
  const categoria = document.getElementById("modal-category");
  const nombre = document.getElementById("modal-name");
  const precio = document.getElementById("modal-price");
  const descripcion = document.getElementById("modal-description");
  const boton = document.getElementById("modal-add-button");
  const stock = Number(producto.stock || 0);
  const tallas = normalizarTallas(producto.sizes);

  if (imagen) {
    imagen.src = producto.image || producto.imageUrl || "images/Logo Urban.png";
    imagen.alt = producto.name || "Producto";
    imagen.onerror = function () {
      this.src = "images/Logo Urban.png";
    };
  }

  if (categoria) categoria.textContent = producto.category || "General";
  if (nombre) nombre.textContent = producto.name || "Producto";
  if (precio) precio.textContent = formatearPrecio(producto.price);
  if (descripcion) descripcion.textContent = producto.description || "Producto Urban Society.";

  let sizeField = document.getElementById("modal-size-field");
  if (!sizeField && boton?.parentElement) {
    sizeField = document.createElement("div");
    sizeField.id = "modal-size-field";
    sizeField.className = "modal-size-field";
    boton.parentElement.insertBefore(sizeField, boton);
  }

  if (sizeField) {
    if (tallas.length) {
      sizeField.hidden = false;
      sizeField.innerHTML = `
        <label for="modal-size-select">Talla</label>
        <select id="modal-size-select">
          <option value="">Selecciona tu talla</option>
          ${tallas.map(talla => `<option value="${escaparHTML(talla)}">${escaparHTML(talla)}</option>`).join("")}
        </select>
      `;
    } else {
      sizeField.hidden = true;
      sizeField.innerHTML = "";
    }
  }

  if (boton) {
    boton.disabled = stock <= 0;
    boton.textContent = stock > 0
      ? tallas.length ? "Elegir talla y agregar" : "Agregar al carrito"
      : "Agotado";

    boton.onclick = function () {
      const talla = tallas.length
        ? document.getElementById("modal-size-select")?.value || ""
        : "";

      if (tallas.length && !talla) {
        mostrarNotificacion("Selecciona una talla antes de agregar.");
        document.getElementById("modal-size-select")?.focus();
        return;
      }

      agregarAlCarrito(producto.objectId, talla);
      cerrarModalProducto();
    };
  }

  modal.classList.add("active");
}

function cerrarModalProducto() {
  document.getElementById("product-modal")?.classList.remove("active");
}


/* =========================================================
   CARRITO
========================================================= */

function cargarCarritoLocal() {
  try {
    const guardado = localStorage.getItem("urbanSocietyCart");
    carritoUrban = guardado ? JSON.parse(guardado) : [];
    if (!Array.isArray(carritoUrban)) carritoUrban = [];
  } catch (error) {
    console.error("Error leyendo carrito:", error);
    carritoUrban = [];
  }
}

function guardarCarritoLocal() {
  localStorage.setItem("urbanSocietyCart", JSON.stringify(carritoUrban));
}

function sincronizarCarritoConCatalogo() {
  const anterior = JSON.stringify(carritoUrban);

  carritoUrban = carritoUrban
    .map(item => {
      const producto = productosUrban.find(p => p.objectId === item.id && p.active !== false);
      if (!producto) return null;

      const stock = Number(producto.stock || 0);
      if (stock <= 0) return null;

      const tallas = normalizarTallas(producto.sizes);
      const talla = String(item.size || "").trim();
      if (tallas.length && !tallas.includes(talla)) return null;

      const quantity = Math.min(Math.max(Number(item.quantity || 1), 1), stock);
      return { id: item.id, quantity, size: talla };
    })
    .filter(Boolean);

  if (JSON.stringify(carritoUrban) !== anterior) {
    guardarCarritoLocal();
    actualizarCarritoUI();
  }
}

function agregarAlCarrito(id, talla = "") {
  const producto = productosUrban.find(item => item.objectId === id && item.active !== false);

  if (!producto) {
    mostrarNotificacion("Producto no disponible.");
    return;
  }

  const stock = Number(producto.stock || 0);
  if (stock <= 0) {
    mostrarNotificacion("Producto agotado.");
    return;
  }

  const tallas = normalizarTallas(producto.sizes);
  const tallaNormalizada = String(talla || "").trim();

  if (tallas.length && !tallas.includes(tallaNormalizada)) {
    mostrarNotificacion("Selecciona una talla válida.");
    abrirProducto(id);
    return;
  }

  const existente = carritoUrban.find(item =>
    item.id === id && String(item.size || "") === tallaNormalizada
  );

  if (existente) {
    if (Number(existente.quantity || 0) >= stock) {
      mostrarNotificacion("No hay más unidades disponibles.");
      return;
    }
    existente.quantity = Number(existente.quantity || 0) + 1;
  } else {
    carritoUrban.push({ id, quantity: 1, size: tallaNormalizada });
  }

  guardarCarritoLocal();
  actualizarCarritoUI();
  mostrarNotificacion(
    tallaNormalizada
      ? `Producto agregado · Talla ${tallaNormalizada}`
      : "Producto agregado al carrito."
  );
}

function cambiarCantidad(id, tallaCodificada, cantidad) {
  const talla = decodeURIComponent(String(tallaCodificada || ""));
  const producto = productosUrban.find(item => item.objectId === id);
  const item = carritoUrban.find(item =>
    item.id === id && String(item.size || "") === talla
  );
  if (!producto || !item) return;

  const stock = Number(producto.stock || 0);
  const nuevaCantidad = Number(cantidad || 0);

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(id, tallaCodificada);
    return;
  }

  if (nuevaCantidad > stock) {
    mostrarNotificacion(`Solo hay ${stock} disponibles.`);
    return;
  }

  item.quantity = nuevaCantidad;
  guardarCarritoLocal();
  actualizarCarritoUI();
  mostrarCarrito();
}

function eliminarDelCarrito(id, tallaCodificada = "") {
  const talla = decodeURIComponent(String(tallaCodificada || ""));
  carritoUrban = carritoUrban.filter(item => !(
    item.id === id && String(item.size || "") === talla
  ));
  guardarCarritoLocal();
  actualizarCarritoUI();
  mostrarCarrito();
}

function actualizarCarritoUI() {
  const contador = document.getElementById("cart-count");
  if (!contador) return;

  const cantidad = carritoUrban.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  contador.textContent = cantidad;
  contador.hidden = cantidad <= 0;
}

function abrirCarrito() {
  mostrarCarrito();
  document.getElementById("cart-modal")?.classList.add("active");
}

function cerrarCarrito() {
  document.getElementById("cart-modal")?.classList.remove("active");
}

function mostrarCarrito() {
  const container = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const checkoutButton = document.getElementById("checkout-button");
  if (!container) return;

  if (!carritoUrban.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <h3>Tu carrito está vacío</h3>
        <p>Encuentra algo que vaya con tu estilo.</p>
      </div>
    `;
    if (totalElement) totalElement.textContent = "$0.00 MXN";
    if (checkoutButton) checkoutButton.disabled = true;
    return;
  }

  if (checkoutButton) checkoutButton.disabled = false;
  let total = 0;

  container.innerHTML = carritoUrban.map(item => {
    const producto = productosUrban.find(p => p.objectId === item.id);
    if (!producto) return "";

    const precio = Number(producto.price || 0);
    const cantidad = Number(item.quantity || 0);
    const subtotal = precio * cantidad;
    const talla = String(item.size || "");
    const tallaCodificada = encodeURIComponent(talla);
    total += subtotal;

    return `
      <div class="cart-item">
        <img
          src="${escaparHTML(producto.image || producto.imageUrl || "images/Logo Urban.png")}"
          alt="${escaparHTML(producto.name || "Producto")}"
          onerror="this.src='images/Logo Urban.png'"
        >

        <div class="cart-item-info">
          <strong>${escaparHTML(producto.name || "Producto")}</strong>
          ${talla ? `<span class="cart-size">Talla ${escaparHTML(talla)}</span>` : ""}
          <span>${formatearPrecio(precio)}</span>
          <div class="quantity-controls">
            <button type="button" aria-label="Restar unidad" onclick="cambiarCantidad('${item.id}', '${tallaCodificada}', ${cantidad - 1})">−</button>
            <strong>${cantidad}</strong>
            <button type="button" aria-label="Agregar unidad" onclick="cambiarCantidad('${item.id}', '${tallaCodificada}', ${cantidad + 1})">+</button>
          </div>
        </div>

        <div>
          <strong>${formatearPrecio(subtotal)}</strong>
          <button
            type="button"
            class="remove-cart"
            onclick="eliminarDelCarrito('${item.id}', '${tallaCodificada}')"
            aria-label="Eliminar ${escaparHTML(producto.name || "producto")}"
            title="Eliminar"
          >×</button>
        </div>
      </div>
    `;
  }).join("");

  if (totalElement) totalElement.textContent = formatearPrecio(total);
}

function obtenerTotalCarrito() {
  return carritoUrban.reduce((total, item) => {
    const producto = productosUrban.find(p => p.objectId === item.id);
    if (!producto) return total;

    return total +
      Number(producto.price || 0) * Number(item.quantity || 0);
  }, 0);
}


/* =========================================================
   UI DEL CHECKOUT
========================================================= */

function iniciarCheckout() {
  if (!carritoUrban.length) {
    mostrarNotificacion("Tu carrito está vacío.");
    return;
  }

  const checkoutModal = document.getElementById("checkout-modal");
  if (!checkoutModal) return;

  if (typeof usuarioActual !== "undefined" && usuarioActual) {
    const nombre = document.getElementById("checkout-name");
    const email = document.getElementById("checkout-email");
    const phone = document.getElementById("checkout-phone");

    if (nombre && !nombre.value) nombre.value = usuarioActual.name || "";
    if (email && !email.value) email.value = usuarioActual.email || "";
    if (phone && !phone.value) phone.value = usuarioActual.phone || "";
  }

  checkoutModal.classList.add("active");
  cerrarCarrito();
}

function cerrarCheckout() {
  document.getElementById("checkout-modal")?.classList.remove("active");
}


/* =========================================================
   BUSCADOR Y FILTROS
========================================================= */

function configurarBuscador() {
  document.getElementById("search-input")?.addEventListener("input", filtrarProductos);
  document.getElementById("category-filter")?.addEventListener("change", filtrarProductos);
}

function filtrarProductos() {
  const search = (document.getElementById("search-input")?.value || "")
    .trim()
    .toLowerCase();
  const category = document.getElementById("category-filter")?.value || "";

  const filtrados = productosUrban.filter(producto => {
    const nombre = String(producto.name || "").toLowerCase();
    const descripcion = String(producto.description || "").toLowerCase();
    const categoria = String(producto.category || "");
    const tallas = String(producto.sizes || "").toLowerCase();

    const coincideTexto = !search ||
      nombre.includes(search) ||
      descripcion.includes(search) ||
      categoria.toLowerCase().includes(search) ||
      tallas.includes(search);

    const coincideCategoria = !category || categoria === category;
    return coincideTexto && coincideCategoria;
  });

  actualizarMetaCatalogo(filtrados.length, productosUrban.length);
  mostrarProductos(filtrados, Boolean(search || category));
}

function actualizarMetaCatalogo(visibles, total) {
  const tools = document.querySelector(".catalog-tools");
  if (!tools) return;

  let meta = document.getElementById("catalog-meta");
  if (!meta) {
    meta = document.createElement("div");
    meta.id = "catalog-meta";
    meta.className = "catalog-meta";
    tools.insertAdjacentElement("afterend", meta);
  }

  meta.innerHTML = `
    <span><strong>${Number(visibles || 0)}</strong> ${Number(visibles) === 1 ? "producto" : "productos"}</span>
    ${visibles !== total ? `<span>de ${Number(total || 0)} disponibles</span>` : '<span>Stock actualizado</span>'}
  `;
}


/* =========================================================
   UTILIDADES
========================================================= */

function normalizarTallas(value) {
  return [...new Set(
    String(value || "")
      .split(/[,;|]+/)
      .map(talla => talla.trim())
      .filter(Boolean)
  )];
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(precio || 0));
}

function escaparHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mostrarNotificacion(mensaje) {
  let notification = document.querySelector(".urban-notification");

  if (!notification) {
    notification = document.createElement("div");
    notification.className = "urban-notification";
    document.body.appendChild(notification);
  }

  notification.textContent = mensaje;
  notification.classList.remove("show");
  void notification.offsetWidth;
  notification.classList.add("show");

  clearTimeout(window.__urbanNotificationTimer);
  window.__urbanNotificationTimer = setTimeout(() => {
    notification.classList.remove("show");
  }, 2500);
}


document.addEventListener("click", event => {
  if (event.target.classList.contains("modal-overlay")) {
    event.target.classList.remove("active");
  }
});


/* =========================================================
   EXPORTAR FUNCIONES USADAS POR LA UI Y OTROS MÓDULOS
========================================================= */

window.cargarProductos = cargarProductos;
window.mostrarProductos = mostrarProductos;
window.abrirProducto = abrirProducto;
window.cerrarModalProducto = cerrarModalProducto;
window.agregarAlCarrito = agregarAlCarrito;
window.guardarCarritoLocal = guardarCarritoLocal;
window.actualizarCarritoUI = actualizarCarritoUI;
window.abrirCarrito = abrirCarrito;
window.cerrarCarrito = cerrarCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.iniciarCheckout = iniciarCheckout;
window.cerrarCheckout = cerrarCheckout;
window.mostrarCarrito = mostrarCarrito;
window.obtenerTotalCarrito = obtenerTotalCarrito;
window.formatearPrecio = formatearPrecio;
window.escaparHTML = escaparHTML;
window.normalizarTallas = normalizarTallas;
window.mostrarNotificacion = mostrarNotificacion;
