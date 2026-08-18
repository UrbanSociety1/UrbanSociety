/* =========================================================
   URBAN SOCIETY
   ORDER-NOTIFICATIONS.JS
   Pedidos Backendless + copia por Formspree + diagnóstico
========================================================= */

(function () {
  if (window.__urbanOrderNotifierInstalled) return;
  window.__urbanOrderNotifierInstalled = true;

  const BACKENDLESS_ORDERS_TABLE = "Orders";

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
    } catch (error) {
      console.warn("No se pudieron interpretar los productos del pedido:", error);
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

    return productos
      .map((producto, index) => {
        const cantidad = Number(producto.quantity || 0);
        const precio = Number(producto.price || 0);
        const subtotal = Number(
          producto.subtotal ||
          precio * cantidad
        );

        return [
          `${index + 1}. ${producto.name || "Producto"}`,
          `Cantidad: ${cantidad}`,
          `Precio: ${formatearMXN(precio)}`,
          `Subtotal: ${formatearMXN(subtotal)}`
        ].join(" | ");
      })
      .join("\n");
  }

  async function enviarCopiaPedidoFormspree(pedido, guardado) {
    const endpoint = obtenerEndpointPedidos();

    if (!endpointValido(endpoint)) {
      console.info(
        "Pedido guardado en Backendless. No se envió copia por correo porque falta el endpoint de Formspree para pedidos."
      );
      return false;
    }

    const pedidoId = String(
      guardado?.objectId ||
      pedido?.objectId ||
      "Generado"
    );

    const claveEnviado = `urban-order-formspree-${pedidoId}`;

    try {
      if (pedidoId !== "Generado" && localStorage.getItem(claveEnviado)) {
        return true;
      }
    } catch (_) {
      // Si localStorage no está disponible, el envío puede continuar.
    }

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
    data.set("backendless", `Guardado correctamente en tabla ${BACKENDLESS_ORDERS_TABLE}`);
    data.set("origen", "Urban Society");

    try {
      const respuesta = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json"
        }
      });

      if (!respuesta.ok) {
        throw new Error(`Formspree respondió ${respuesta.status}`);
      }

      try {
        if (pedidoId !== "Generado") {
          localStorage.setItem(claveEnviado, "1");
        }
      } catch (_) {
        // El correo ya salió; no es grave si no se puede guardar la marca local.
      }

      console.info(
        `✓ Pedido #${pedidoId} guardado en Backendless (${BACKENDLESS_ORDERS_TABLE}) y enviado a Formspree.`
      );

      return true;
    } catch (error) {
      console.error(
        `Pedido #${pedidoId} sí quedó guardado en Backendless, pero falló la copia por Formspree:`,
        error
      );
      return false;
    }
  }

  function instalarInterceptorPedidos() {
    if (
      typeof Backendless === "undefined" ||
      !Backendless.Data ||
      typeof Backendless.Data.of !== "function"
    ) {
      console.warn("No se pudo instalar el módulo de pedidos: Backendless.Data.of no está disponible.");
      return false;
    }

    if (Backendless.Data.of.__urbanOrdersPatched) return true;

    const originalOf = Backendless.Data.of.bind(Backendless.Data);

    function urbanDataOf(tableName) {
      const nombreSolicitado = String(tableName || "");
      const esTablaPedidos = ["orders", "pedidos"].includes(
        nombreSolicitado.toLowerCase()
      );

      /*
         La tabla configurada para pedidos es Orders. Si alguna parte
         antigua del proyecto pide "Pedidos", también la redirigimos
         a Orders para mantener una sola fuente de datos.
      */
      const nombreReal = esTablaPedidos
        ? BACKENDLESS_ORDERS_TABLE
        : tableName;

      const store = originalOf(nombreReal);

      if (
        !esTablaPedidos ||
        !store ||
        typeof store.save !== "function"
      ) {
        return store;
      }

      const originalSave = store.save.bind(store);

      store.save = async function (pedido) {
        console.info(`Guardando pedido en Backendless → ${BACKENDLESS_ORDERS_TABLE}...`);

        const guardado = await originalSave(pedido);

        console.info(
          `✓ Pedido guardado en ${BACKENDLESS_ORDERS_TABLE}:`,
          guardado?.objectId || guardado
        );

        // El correo es secundario: un fallo de Formspree no invalida el pedido.
        enviarCopiaPedidoFormspree(pedido, guardado);

        return guardado;
      };

      return store;
    }

    urbanDataOf.__urbanOrdersPatched = true;
    Backendless.Data.of = urbanDataOf;

    console.info(
      `Avisos de pedidos Urban Society activados. Pedidos/Orders → ${BACKENDLESS_ORDERS_TABLE}.`
    );
    return true;
  }

  async function verificarBackendlessUrban() {
    const resultado = {
      sdk: typeof Backendless !== "undefined",
      configuracion: typeof BACKENDLESS_CONFIG !== "undefined",
      inicializado: false,
      products_lectura: false,
      pedidos_lectura: false,
      pedidos_escritura: "No probada",
      tabla_pedidos: BACKENDLESS_ORDERS_TABLE,
      sesion: "No comprobada"
    };

    try {
      resultado.inicializado =
        typeof iniciarBackendless === "function"
          ? Boolean(iniciarBackendless())
          : resultado.sdk;

      if (!resultado.inicializado) {
        console.table(resultado);
        return resultado;
      }

      try {
        const queryProducts = Backendless.DataQueryBuilder
          .create()
          .setPageSize(1);

        await Backendless.Data.of("Products").find(queryProducts);
        resultado.products_lectura = true;
      } catch (error) {
        resultado.products_error = error.message || String(error);
      }

      try {
        const queryPedidos = Backendless.DataQueryBuilder
          .create()
          .setPageSize(1);

        await Backendless.Data.of(BACKENDLESS_ORDERS_TABLE).find(queryPedidos);
        resultado.pedidos_lectura = true;
      } catch (error) {
        resultado.pedidos_error = error.message || String(error);
      }

      try {
        const usuario = await Backendless.UserService.getCurrentUser();
        resultado.sesion = usuario
          ? `Activa: ${usuario.email || usuario.objectId || "usuario"}`
          : "Sin sesión activa";
      } catch (error) {
        resultado.sesion = `Error: ${error.message || error}`;
      }
    } catch (error) {
      resultado.error_general = error.message || String(error);
    }

    console.table(resultado);
    return resultado;
  }

  instalarInterceptorPedidos();

  window.enviarCopiaPedidoFormspree = enviarCopiaPedidoFormspree;
  window.verificarBackendlessUrban = verificarBackendlessUrban;
  window.URBAN_BACKENDLESS_ORDERS_TABLE = BACKENDLESS_ORDERS_TABLE;
})();
