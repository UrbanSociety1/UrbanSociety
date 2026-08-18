/* =========================================================
   URBAN SOCIETY
   CHECKOUT SEGURO CON SUPABASE

   El navegador solo envía IDs, cantidades y datos de entrega.
   La función SQL create_order toma precios reales, valida stock,
   descuenta inventario y crea el pedido en una sola transacción.
========================================================= */

(function () {
  if (window.__urbanSecureCheckoutInstalled) return;
  window.__urbanSecureCheckoutInstalled = true;

  async function crearPedidoSeguro(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!Array.isArray(carritoUrban) || !carritoUrban.length) {
      alert("El carrito está vacío.");
      return;
    }

    if (!window.urbanSupabase) {
      alert("No se pudo conectar con la tienda. Recarga la página.");
      return;
    }

    const nombre = document.getElementById("checkout-name")?.value.trim();
    const email = document.getElementById("checkout-email")?.value.trim();
    const phone = document.getElementById("checkout-phone")?.value.trim();
    const address = document.getElementById("checkout-address")?.value.trim();
    const paymentMethod = document.getElementById("checkout-payment")?.value;
    const submit = document.getElementById("place-order-button");

    if (!nombre || !email || !phone || !address || !paymentMethod) {
      alert("Completa todos los datos del pedido.");
      return;
    }

    const items = carritoUrban.map(item => ({
      product_id: String(item.id || "").trim(),
      quantity: Number(item.quantity || 0)
    }));

    if (
      items.some(item =>
        !item.product_id ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      )
    ) {
      alert("El carrito contiene datos inválidos. Recarga e intenta nuevamente.");
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "PROCESANDO PEDIDO...";
    }

    try {
      const payload = {
        customerName: nombre,
        customerEmail: email,
        customerPhone: phone,
        address,
        paymentMethod,
        items
      };

      const { data, error } = await window.urbanSupabase.rpc(
        "create_order",
        { payload }
      );

      if (error) throw error;

      const pedido = data || {};

      if (!pedido.objectId && !pedido.id) {
        throw new Error("Supabase no devolvió el número de pedido.");
      }

      if (typeof window.enviarCopiaPedidoFormspree === "function") {
        window.enviarCopiaPedidoFormspree(pedido, pedido);
      }

      carritoUrban = [];
      guardarCarritoLocal();
      actualizarCarritoUI();
      cerrarCheckout();

      document.getElementById("checkout-form")?.reset();

      const orderId = pedido.objectId || pedido.id;
      const total = Number(pedido.total || 0);

      alert(
        "¡Pedido recibido correctamente!\n\n" +
        "Número de pedido: " + orderId +
        (Number.isFinite(total) && total > 0
          ? "\nTotal confirmado: " +
            new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN"
            }).format(total)
          : "")
      );

      await cargarProductos();
    } catch (error) {
      console.error("Error creando pedido en Supabase:", error);
      alert(
        "No se pudo realizar el pedido.\n\n" +
        (error?.message || "Error desconocido.")
      );
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "ENVIAR PEDIDO";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("checkout-form");
    if (!form) return;
    form.addEventListener("submit", crearPedidoSeguro);
  });

  window.crearPedidoSeguro = crearPedidoSeguro;
})();
