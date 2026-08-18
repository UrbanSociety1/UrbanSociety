/* =========================================================
   URBAN SOCIETY
   MIS PEDIDOS
========================================================= */

(function () {
  if (window.__urbanMyOrdersInstalled) return;
  window.__urbanMyOrdersInstalled = true;

  const ORDERS_TABLE = "Orders";

  function cargarEstilosMisPedidos() {
    if (document.querySelector('link[data-urban-my-orders]')) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "css/my-orders.css";
    link.dataset.urbanMyOrders = "1";
    document.head.appendChild(link);
  }

  function escapar(value) {
    if (typeof window.escapeHTML === "function") {
      return window.escapeHTML(value);
    }

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatearPrecio(value) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(Number(value || 0));
  }

  function formatearFecha(value) {
    if (!value) return "Fecha no disponible";

    const fecha = new Date(Number(value) || value);
    if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";

    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(fecha);
  }

  function parsearProductos(value) {
    if (Array.isArray(value)) return value;

    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function asegurarModal() {
    let modal = document.getElementById("my-orders-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "my-orders-modal";
    modal.className = "modal-overlay my-orders-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "my-orders-title");

    modal.innerHTML = `
      <div class="modal-card my-orders-card">
        <button type="button" class="modal-close" onclick="cerrarMisPedidos()" aria-label="Cerrar">×</button>
        <div class="my-orders-heading">
          <div>
            <p class="eyebrow">MI CUENTA</p>
            <h2 id="my-orders-title">MIS <span>PEDIDOS</span></h2>
            <p class="muted">Consulta aquí el estado de tus compras.</p>
          </div>
          <button type="button" class="btn btn-secondary my-orders-refresh" onclick="cargarMisPedidos()">ACTUALIZAR</button>
        </div>
        <div id="my-orders-content" class="my-orders-content">
          <div class="my-orders-loading">Cargando pedidos...</div>
        </div>
      </div>
    `;

    modal.addEventListener("click", event => {
      if (event.target === modal) cerrarMisPedidos();
    });

    document.body.appendChild(modal);
    return modal;
  }

  function tarjetaPedido(pedido) {
    const productos = parsearProductos(pedido.products);
    const estado = escapar(pedido.status || "Pendiente");
    const id = escapar(pedido.objectId || "Sin número");

    const detalleProductos = productos.length
      ? productos.map(producto => {
          const cantidad = Number(producto.quantity || 0);
          const nombre = escapar(producto.name || "Producto");
          return `<li><span>${cantidad} × ${nombre}</span><strong>${formatearPrecio(producto.subtotal || (Number(producto.price || 0) * cantidad))}</strong></li>`;
        }).join("")
      : '<li><span>Sin detalle de productos</span></li>';

    const estadoClase = String(pedido.status || "Pendiente")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    return `
      <article class="my-order-card">
        <div class="my-order-top">
          <div>
            <span class="my-order-label">Pedido</span>
            <strong class="my-order-id">#${id}</strong>
          </div>
          <span class="my-order-status status-${estadoClase}">${estado}</span>
        </div>

        <div class="my-order-meta">
          <span>${escapar(formatearFecha(pedido.created))}</span>
          <strong>${formatearPrecio(pedido.total)}</strong>
        </div>

        <ul class="my-order-products">${detalleProductos}</ul>

        <div class="my-order-footer">
          <span>Pago: ${escapar(pedido.paymentMethod || "Por acordar")}</span>
          <span>${escapar(pedido.address || "")}</span>
        </div>
      </article>
    `;
  }

  async function cargarMisPedidos() {
    const contenido = document.getElementById("my-orders-content");
    if (!contenido) return;

    if (typeof usuarioActual === "undefined" || !usuarioActual) {
      contenido.innerHTML = '<div class="my-orders-empty"><h3>Inicia sesión</h3><p>Necesitas iniciar sesión para consultar tus pedidos.</p></div>';
      return;
    }

    contenido.innerHTML = '<div class="my-orders-loading">Cargando pedidos...</div>';

    try {
      const userId = String(usuarioActual.objectId || "").replace(/'/g, "\\'");
      const query = Backendless.DataQueryBuilder
        .create()
        .setWhereClause(`userId = '${userId}'`)
        .setSortBy(["created DESC"])
        .setPageSize(50);

      const pedidos = await Backendless.Data.of(ORDERS_TABLE).find(query) || [];

      if (!pedidos.length) {
        contenido.innerHTML = `
          <div class="my-orders-empty">
            <h3>Aún no tienes pedidos</h3>
            <p>Cuando realices una compra con esta cuenta aparecerá aquí.</p>
          </div>
        `;
        return;
      }

      contenido.innerHTML = pedidos.map(tarjetaPedido).join("");
    } catch (error) {
      console.error("Error cargando Mis pedidos:", error);
      contenido.innerHTML = `
        <div class="my-orders-error">
          <h3>No pudimos cargar tus pedidos</h3>
          <p>${escapar(error?.message || "Revisa la configuración de permisos de Orders.")}</p>
        </div>
      `;
    }
  }

  async function mostrarMisPedidos() {
    document.getElementById("account-menu")?.remove();

    if (typeof usuarioActual === "undefined" || !usuarioActual) {
      if (typeof window.mostrarLogin === "function") window.mostrarLogin();
      return;
    }

    const modal = asegurarModal();
    modal.classList.add("active");
    await cargarMisPedidos();
  }

  function cerrarMisPedidos() {
    document.getElementById("my-orders-modal")?.classList.remove("active");
  }

  function instalarBotonCuenta() {
    const original = window.mostrarMenuCuenta;
    if (typeof original !== "function" || original.__urbanMyOrdersWrapped) return;

    function menuConPedidos() {
      original();

      const menu = document.getElementById("account-menu");
      if (!menu || document.getElementById("my-orders-menu-button")) return;

      const cerrar = Array.from(menu.querySelectorAll("button"))
        .find(button => /cerrar sesi[oó]n/i.test(button.textContent || ""));

      const boton = document.createElement("button");
      boton.id = "my-orders-menu-button";
      boton.type = "button";
      boton.className = "btn btn-secondary full";
      boton.style.marginBottom = "10px";
      boton.textContent = "MIS PEDIDOS";
      boton.addEventListener("click", mostrarMisPedidos);

      if (cerrar) menu.insertBefore(boton, cerrar);
      else menu.appendChild(boton);
    }

    menuConPedidos.__urbanMyOrdersWrapped = true;
    window.mostrarMenuCuenta = menuConPedidos;
  }

  document.addEventListener("DOMContentLoaded", () => {
    cargarEstilosMisPedidos();
    instalarBotonCuenta();
  });

  window.mostrarMisPedidos = mostrarMisPedidos;
  window.cerrarMisPedidos = cerrarMisPedidos;
  window.cargarMisPedidos = cargarMisPedidos;
})();
