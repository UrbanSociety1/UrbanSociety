/*
  URBAN SOCIETY - CheckoutService / createOrder

  Este archivo es una COPIA DE REFERENCIA para pegar dentro del bloque
  Custom Code de Backendless Codeless. No se ejecuta desde el navegador.

  Método recomendado:
    Service: CheckoutService
    Method: createOrder
    HTTP: POST
    Route: /create-order
    Parameter: payload (Any Object)

  Conecta el argumento `payload` del método a un Custom Code con un
  argumento también llamado `payload`, activa "Return result" y pega
  solamente el cuerpo de la función checkoutServerSide de abajo.
*/

async function checkoutServerSide(payload) {
  const data = payload && typeof payload === "object" ? payload : {};

  const customerName = String(data.customerName || "").trim();
  const customerEmail = String(data.customerEmail || "").trim().toLowerCase();
  const customerPhone = String(data.customerPhone || "").trim();
  const address = String(data.address || "").trim();
  const paymentMethod = String(data.paymentMethod || "").trim();
  const userId = data.userId ? String(data.userId).trim() : null;
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
    userId: userId || null
  };

  /*
    El afterCreate de Orders que ya existe en Backendless se encarga de
    descontar el stock. Al invocar este servicio SIN user-token, las llamadas
    internas corren con ServerCodeUser y el navegador nunca recibe permiso
    para modificar Products.
  */
  const guardado = await Backendless.Data.of("Orders").save(pedido);

  return guardado;
}
