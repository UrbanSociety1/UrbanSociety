/*
  URBAN SOCIETY - CheckoutService

  ESTRUCTURA RECOMENDADA
  ======================

  1) Método público:
     Service: CheckoutService
     Method: createOrder
     HTTP: POST
     Route: /create-order
     Parameter: payload (Any Object)

     Este método recibe el user-token del navegador SOLO para que Backendless
     pueda exponer el bloque contextual "User Id".

     La lógica de createOrder debe llamar a createOrderCore mediante un bloque
     de API Service, conectando:
       - payload  -> payload
       - User Id  -> userId
       - user-token -> NULL

     Y devolver el resultado de createOrderCore.

  2) Método interno:
     Service: CheckoutService
     Method: createOrderCore
     Parameter: payload (Any Object)
     Parameter: userId (String, no requerido)

     Este método debe permitir invocación únicamente a ServerCodeUser.
     Dentro de createOrderCore agrega un bloque Custom Code con argumentos
     `payload` y `userId`, activa "Return result" y pega SOLAMENTE el cuerpo
     de la función checkoutServerSide de abajo.

  De esta forma el navegador nunca decide el userId del pedido y las llamadas
  a Products/Orders se ejecutan sin AuthenticatedUser en el contexto interno.
*/

async function checkoutServerSide(payload, userId) {
  const data = payload && typeof payload === "object" ? payload : {};

  const customerName = String(data.customerName || "").trim();
  const customerEmail = String(data.customerEmail || "").trim().toLowerCase();
  const customerPhone = String(data.customerPhone || "").trim();
  const address = String(data.address || "").trim();
  const paymentMethod = String(data.paymentMethod || "").trim();
  const trustedUserId = userId ? String(userId).trim() : null;
  const items = Array.isArray(data.items) ? data.items : [];

  if (customerName.length < 2 || customerName.length > 120) {
    throw new Error("Nombre inválido.");
  }

  if (
    customerEmail.length > 160 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
  ) {
    throw new Error("Correo inválido.");
  }

  if (customerPhone.length < 5 || customerPhone.length > 25) {
    throw new Error("Teléfono inválido.");
  }

  if (address.length < 5 || address.length > 500) {
    throw new Error("Dirección inválida.");
  }

  const metodosPermitidos = [
    "Transferencia",
    "Efectivo",
    "Por acordar"
  ];

  if (!metodosPermitidos.includes(paymentMethod)) {
    throw new Error("Método de pago inválido.");
  }

  if (!items.length || items.length > 50) {
    throw new Error("El pedido no contiene productos válidos.");
  }

  /*
    Agrupamos IDs repetidos. El cliente únicamente controla ID + cantidad;
    nombre, precio, subtotal y total siempre salen de Products en Backendless.
  */
  const cantidades = new Map();

  for (const item of items) {
    const productId = String(item?.productId || "").trim();
    const quantity = Number(item?.quantity || 0);

    if (!productId || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      throw new Error("Cantidad o producto inválido.");
    }

    cantidades.set(
      productId,
      Number(cantidades.get(productId) || 0) + quantity
    );
  }

  const productosPedido = [];
  let total = 0;

  for (const [productId, quantity] of cantidades.entries()) {
    const producto = await Backendless.Data
      .of("Products")
      .findById(productId);

    if (!producto) {
      throw new Error("Uno de los productos ya no existe.");
    }

    const stock = Number(producto.stock || 0);
    const price = Number(producto.price || 0);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Precio inválido para ${producto.name || "un producto"}.`);
    }

    if (stock < quantity) {
      throw new Error(
        `No hay suficiente stock de ${producto.name || "un producto"}. Disponible: ${stock}.`
      );
    }

    const subtotal = Math.round((price * quantity + Number.EPSILON) * 100) / 100;
    total += subtotal;

    productosPedido.push({
      productId: producto.objectId,
      name: String(producto.name || "Producto"),
      price,
      quantity,
      subtotal
    });
  }

  total = Math.round((total + Number.EPSILON) * 100) / 100;

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("El total del pedido no es válido.");
  }

  const pedido = {
    customerName,
    customerEmail,
    customerPhone,
    address,
    paymentMethod,
    products: JSON.stringify(productosPedido),
    total,
    status: "Pendiente",
    userId: trustedUserId || null
  };

  /*
    El afterCreate de Orders ya existente se encarga de descontar el stock.
    createOrderCore debe invocarse con user-token NULL, por lo que las
    llamadas internas se ejecutan únicamente bajo ServerCodeUser.
  */
  const guardado = await Backendless.Data.of("Orders").save(pedido);

  return guardado;
}
