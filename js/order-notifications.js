/* =========================================================
   URBAN SOCIETY
   ORDER NOTIFICATIONS
   Copia de pedidos por Formspree.
========================================================= */

(function () {
  if (window.__urbanOrderNotifierInstalled) return;
  window.__urbanOrderNotifierInstalled = true;

  function obtenerEndpointPedidos() {
    return String(
      window.FORMSPREE_ORDERS_ENDPOINT ||
      window.FORMSPREE_ENDPOINT ||
      ""
    ).trim();
  }

  function endpointValido(endpoint) {
    return /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(endpoint);
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

  function formatearMXN(value) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(Number(value || 0));
  }

  function resumenProductos(productos) {
    if (!productos.length) return "Sin detalle de productos";

    return productos.map((producto, index) => {
      const cantidad = Number(producto.quantity || 0);
      const precio = Number(producto.price || 0);
      const subtotal = Number(
        producto.subtotal || precio * cantidad
      );

      return [
        `${index + 1}. ${producto.name || "Producto"}`,
        `Cantidad: ${cantidad}`,
        `Precio: ${formatearMXN(precio)}`,
        `Subtotal: ${formatearMXN(subtotal)}`
      ].join(" | ");
    }).join("\n");
  }

  async function enviarCopiaPedidoFormspree(pedido, guardado) {
    const endpoint = obtenerEndpointPedidos();

    if (!endpointValido(endpoint)) {
      console.info("Pedido guardado en Supabase; Formspree no está configurado.");
      return false;
    }

    const pedidoId = String(
      guardado?.objectId ||
      guardado?.id ||
      pedido?.objectId ||
      pedido?.id ||
      "Generado"
    );

    const claveEnviado = `urban-order-formspree-${pedidoId}`;

    try {
      if (pedidoId !== "Generado" && localStorage.getItem(claveEnviado)) {
        return true;
      }
    } catch (_) {}

    const productos = parsearProductos(pedido?.products);
    const data = new FormData();

    data.set("_subject", `NUEVO PEDIDO URBAN SOCIETY #${pedidoId}`);
    data.set("tipo", "PEDIDO");
    data.set("pedido_id", pedidoId);
    data.set("cliente", pedido?.customerName || "");
    data.set("email", pedido?.customerEmail || "");
    data.set("telefono", pedido?.customerPhone || "");
    data.set("direccion", pedido?.address || "");
    data.set("metodo_pago", pedido?.paymentMethod || "");
    data.set("estado", pedido?.status || "Pendiente");
    data.set("productos", resumenProductos(productos));
    data.set("total", formatearMXN(pedido?.total));
    data.set("almacenamiento", "Supabase");
    data.set("origen", "Urban Society");

    try {
      const respuesta = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });

      if (!respuesta.ok) {
        throw new Error(`Formspree respondió ${respuesta.status}`);
      }

      try {
        if (pedidoId !== "Generado") {
          localStorage.setItem(claveEnviado, "1");
        }
      } catch (_) {}

      console.info(`✓ Copia del pedido #${pedidoId} enviada por Formspree.`);
      return true;
    } catch (error) {
      console.error(
        `El pedido #${pedidoId} quedó guardado en Supabase, pero falló Formspree:`,
        error
      );
      return false;
    }
  }

  window.enviarCopiaPedidoFormspree = enviarCopiaPedidoFormspree;
})();
