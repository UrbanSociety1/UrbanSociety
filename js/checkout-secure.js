/* =========================================================
   URBAN SOCIETY
   CHECKOUT SEGURO
   El cliente crea pedidos, pero nunca modifica Products.
========================================================= */

(function () {
  if (window.__urbanSecureCheckoutInstalled) return;
  window.__urbanSecureCheckoutInstalled = true;

  async function guardarPedidoSinToken(pedido) {
    if (
      typeof BACKENDLESS_CONFIG === "undefined" ||
      !BACKENDLESS_CONFIG.SUBDOMAIN
    ) {
      throw new Error("Falta la configuración del endpoint de Backendless.");
    }

    const endpoint =
      `https://${BACKENDLESS_CONFIG.SUBDOMAIN}/api/data/Orders`;

    const respuesta = await fetch(endpoint, {
      method: "POST",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(pedido)
    });

    let data = null;

    try {
      data = await respuesta.json();
    } catch (_) {
      // Si Backendless no devuelve JSON, manejamos el error abajo.
    }

    if (!respuesta.ok) {
      throw new Error(
        data?.message ||
        `Backendless respondió ${respuesta.status}`
      );
    }

    return data || {};
  }

  async function crearPedidoSeguro(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!carritoUrban.length) {
      alert("El carrito está vacío.");
      return;
    }

    const nombre = document.getElementById("checkout-name")?.value.trim();
    const email = document.getElementById("checkout-email")?.value.trim();
    const phone = document.getElementById("checkout-phone")?.value.trim();
    const address = document.getElementById("checkout-address")?.value.trim();
    const payment = document.getElementById("checkout-payment")?.value;
    const submit = document.getElementById("place-order-button");

    if (!nombre || !email || !phone || !address || !payment) {
      alert("Completa todos los datos del pedido.");
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "ENVIANDO PEDIDO...";
    }

    try {
      const productosPedido = [];

      for (const item of carritoUrban) {
        const producto = productosUrban.find(p => p.objectId === item.id);

        if (!producto) {
          throw new Error("Uno de los productos ya no existe.");
        }

        const stock = Number(producto.stock || 0);
        const cantidad = Number(item.quantity || 0);

        if (cantidad > stock) {
          throw new Error(`No hay suficiente stock de ${producto.name}.`);
        }

        productosPedido.push({
          productId: producto.objectId,
          name: producto.name,
          price: Number(producto.price || 0),
          quantity: cantidad,
          subtotal: Number(producto.price || 0) * cantidad
        });
      }

      const pedido = {
        customerName: nombre,
        customerEmail: email,
        customerPhone: phone,
        address: address,
        paymentMethod: payment,
        products: JSON.stringify(productosPedido),
        total: obtenerTotalCarrito(),
        status: "Pendiente",
        userId:
          typeof usuarioActual !== "undefined" && usuarioActual
            ? usuarioActual.objectId
            : null
      };

      /*
         Guardamos Orders sin enviar user-token.

         Así, el afterCreate de Backendless puede actualizar Products
         únicamente con el rol ServerCodeUser, incluso cuando el comprador
         tenga una sesión iniciada. El cliente sigue sin permiso UPDATE.
      */
      const guardado = await guardarPedidoSinToken(pedido);

      /*
         Como este guardado no pasa por Backendless.Data.of(...).save(),
         enviamos explícitamente la copia del pedido a Formspree.
      */
      if (typeof window.enviarCopiaPedidoFormspree === "function") {
        window.enviarCopiaPedidoFormspree(pedido, guardado);
      }

      carritoUrban = [];
      guardarCarritoLocal();
      actualizarCarritoUI();
      cerrarCheckout();

      const form = document.getElementById("checkout-form");
      if (form) form.reset();

      alert(
        "¡Pedido recibido correctamente!\n\n" +
        "Número de pedido: " +
        (guardado?.objectId || "Generado")
      );

      await cargarProductos();
    } catch (error) {
      console.error("Error creando pedido seguro:", error);
      alert(
        "No se pudo realizar el pedido.\n\n" +
        (error.message || "Error desconocido.")
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

    /*
       Este listener se registra antes que el de app.js y corta la
       propagación para evitar que el checkout antiguo intente modificar
       Products desde el navegador.
    */
    form.addEventListener("submit", crearPedidoSeguro);
  });

  window.crearPedidoSeguro = crearPedidoSeguro;
})();
