/* =========================================================
   URBAN SOCIETY
   CHECKOUT SERVER-SIDE

   El navegador NO envía precios, subtotales, total ni userId confiable.
   Solo envía IDs de producto, cantidades y datos de entrega.

   Si existe una sesión, enviamos el user-token únicamente para que
   CheckoutService/createOrder obtenga el User Id desde el contexto seguro
   de Backendless. La lógica interna de datos corre después sin ese token.
========================================================= */

(function () {
  if (window.__urbanServerCheckoutInstalled) return;
  window.__urbanServerCheckoutInstalled = true;

  const SERVICE_NAME = "CheckoutService";
  const SERVICE_ROUTE = "create-order";

  async function obtenerTokenSesion() {
    if (
      typeof Backendless === "undefined" ||
      !Backendless.UserService ||
      typeof Backendless.UserService.getCurrentUserToken !== "function"
    ) {
      return null;
    }

    try {
      return await Backendless.UserService.getCurrentUserToken();
    } catch (_) {
      return null;
    }
  }

  async function llamarCheckoutService(payload) {
    if (
      typeof BACKENDLESS_CONFIG === "undefined" ||
      !BACKENDLESS_CONFIG.SUBDOMAIN
    ) {
      throw new Error("Falta la configuración de Backendless.");
    }

    const endpoint =
      `https://${BACKENDLESS_CONFIG.SUBDOMAIN}/api/services/${SERVICE_NAME}/${SERVICE_ROUTE}`;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    const userToken = await obtenerTokenSesion();
    if (userToken) headers["user-token"] = userToken;

    const respuesta = await fetch(endpoint, {
      method: "POST",
      credentials: "omit",
      headers,
      body: JSON.stringify({ payload })
    });

    let data = null;

    try {
      data = await respuesta.json();
    } catch (_) {
      // El error se maneja más abajo.
    }

    if (!respuesta.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        `Backendless respondió ${respuesta.status}`
      );
    }

    return data?.result || data || {};
  }

  async function crearPedidoServidor(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!Array.isArray(carritoUrban) || !carritoUrban.length) {
      alert("El carrito está vacío.");
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
      productId: String(item.id || "").trim(),
      quantity: Number(item.quantity || 0)
    }));

    if (
      items.some(item =>
        !item.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      )
    ) {
      alert("El carrito contiene datos inválidos. Recarga la página e intenta nuevamente.");
      return;
    }

    const payload = {
      customerName: nombre,
      customerEmail: email,
      customerPhone: phone,
      address,
      paymentMethod,
      items
    };

    if (submit) {
      submit.disabled = true;
      submit.textContent = "PROCESANDO PEDIDO...";
    }

    try {
      const pedido = await llamarCheckoutService(payload);

      if (!pedido?.objectId) {
        throw new Error("Backendless no devolvió el número de pedido.");
      }

      if (typeof window.enviarCopiaPedidoFormspree === "function") {
        window.enviarCopiaPedidoFormspree(pedido, pedido);
      }

      carritoUrban = [];
      guardarCarritoLocal();
      actualizarCarritoUI();
      cerrarCheckout();

      document.getElementById("checkout-form")?.reset();

      alert(
        "¡Pedido recibido correctamente!\n\n" +
        "Número de pedido: " + pedido.objectId +
        (Number.isFinite(Number(pedido.total))
          ? "\nTotal confirmado: " +
            new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN"
            }).format(Number(pedido.total))
          : "")
      );

      await cargarProductos();
    } catch (error) {
      console.error("Error creando pedido en servidor:", error);
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
    form.addEventListener("submit", crearPedidoServidor);
  });

  window.crearPedidoServidor = crearPedidoServidor;
})();
