/* =========================================================
   URBAN SOCIETY
   POS - PUNTO DE VENTA FÍSICO
========================================================= */

let posProducts = [];
let posCart = [];
let posLastSale = null;

function posEl(id) {
  return document.getElementById(id);
}

function posMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(value || 0));
}

function posEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function posSizes(value) {
  return [...new Set(
    String(value || "")
      .split(/[,;|]+/)
      .map(size => size.trim())
      .filter(Boolean)
  )];
}

function posToast(message) {
  const toast = posEl("pos-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(posToast.timer);
  posToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

async function loadPosProducts() {
  const container = posEl("pos-products");
  if (container) container.innerHTML = '<div class="pos-empty">Cargando productos...</div>';

  const { data, error } = await window.urbanSupabase
    .from("products")
    .select("id,name,category,image,price,stock,sizes,active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  posProducts = data || [];
  posEl("pos-product-count").textContent = posProducts.length;
  syncPosCart();
  renderPosProducts();
  renderPosCart();
}

function renderPosProducts() {
  const container = posEl("pos-products");
  if (!container) return;

  const search = String(posEl("pos-search")?.value || "").trim().toLowerCase();
  const products = posProducts.filter(product => {
    const haystack = `${product.name || ""} ${product.category || ""}`.toLowerCase();
    return !search || haystack.includes(search);
  });

  if (!products.length) {
    container.innerHTML = '<div class="pos-empty">No encontramos productos con esa búsqueda.</div>';
    return;
  }

  container.innerHTML = products.map(product => {
    const sizes = posSizes(product.sizes);
    const soldOut = Number(product.stock || 0) <= 0;
    const id = posEscape(product.id);
    const image = posEscape(product.image || "images/Logo Urban.png");
    const name = posEscape(product.name || "Producto");
    const category = posEscape(product.category || "General");

    return `
      <article class="pos-product">
        <img src="${image}" alt="${name}" onerror="this.src='images/Logo Urban.png'">
        <div class="pos-product-body">
          <span class="pos-product-category">${category}</span>
          <h3>${name}</h3>
          <div class="pos-product-meta">
            <span class="pos-product-price">${posMoney(product.price)}</span>
            <span class="pos-product-stock">${soldOut ? "Agotado" : `Stock ${Number(product.stock || 0)}`}</span>
          </div>
          ${sizes.length ? `
            <select id="pos-size-${id}" class="pos-size-select" ${soldOut ? "disabled" : ""}>
              <option value="">Selecciona talla</option>
              ${sizes.map(size => `<option value="${posEscape(size)}">${posEscape(size)}</option>`).join("")}
            </select>
          ` : ""}
          <button type="button" class="pos-add-button" ${soldOut ? "disabled" : ""} onclick="addPosProduct('${id}')">
            ${soldOut ? "AGOTADO" : "AGREGAR"}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function addPosProduct(productId) {
  const product = posProducts.find(item => item.id === productId);
  if (!product || Number(product.stock || 0) <= 0) return;

  const sizes = posSizes(product.sizes);
  const size = sizes.length ? String(posEl(`pos-size-${productId}`)?.value || "") : "";

  if (sizes.length && !size) {
    posToast("Selecciona una talla.");
    return;
  }

  const key = `${productId}::${size}`;
  const existing = posCart.find(item => item.key === key);
  const already = existing ? Number(existing.quantity || 0) : 0;

  if (already >= Number(product.stock || 0)) {
    posToast("No hay más unidades disponibles.");
    return;
  }

  if (existing) existing.quantity += 1;
  else posCart.push({ key, productId, size, quantity: 1 });

  renderPosCart();
  posToast("Producto agregado.");
}

function changePosQuantity(key, delta) {
  const item = posCart.find(row => row.key === key);
  if (!item) return;
  const product = posProducts.find(row => row.id === item.productId);
  if (!product) return removePosItem(key);

  const next = Number(item.quantity || 0) + Number(delta || 0);
  if (next <= 0) return removePosItem(key);

  const totalSameProduct = posCart
    .filter(row => row.productId === item.productId)
    .reduce((sum, row) => sum + (row.key === key ? next : Number(row.quantity || 0)), 0);

  if (totalSameProduct > Number(product.stock || 0)) {
    posToast(`Solo hay ${Number(product.stock || 0)} disponibles.`);
    return;
  }

  item.quantity = next;
  renderPosCart();
}

function removePosItem(key) {
  posCart = posCart.filter(item => item.key !== key);
  renderPosCart();
}

function clearPosCart() {
  if (posCart.length && !confirm("¿Vaciar la venta actual?")) return;
  posCart = [];
  renderPosCart();
}

function syncPosCart() {
  posCart = posCart.filter(item => {
    const product = posProducts.find(row => row.id === item.productId);
    return product && product.active !== false && Number(product.stock || 0) > 0;
  });

  posCart.forEach(item => {
    const product = posProducts.find(row => row.id === item.productId);
    if (product) item.quantity = Math.min(item.quantity, Number(product.stock || 0));
  });
}

function getPosTotal() {
  return posCart.reduce((total, item) => {
    const product = posProducts.find(row => row.id === item.productId);
    return total + Number(product?.price || 0) * Number(item.quantity || 0);
  }, 0);
}

function renderPosCart() {
  const container = posEl("pos-cart-items");
  if (!container) return;

  if (!posCart.length) {
    container.innerHTML = '<div class="pos-empty small">Aún no agregas productos.</div>';
  } else {
    container.innerHTML = posCart.map(item => {
      const product = posProducts.find(row => row.id === item.productId);
      if (!product) return "";
      const subtotal = Number(product.price || 0) * Number(item.quantity || 0);
      return `
        <div class="pos-cart-item">
          <img src="${posEscape(product.image || "images/Logo Urban.png")}" alt="${posEscape(product.name || "Producto")}" onerror="this.src='images/Logo Urban.png'">
          <div>
            <strong>${posEscape(product.name || "Producto")}</strong>
            <small>${item.size ? `Talla ${posEscape(item.size)} · ` : ""}${posMoney(product.price)}</small>
            <div class="pos-qty">
              <button type="button" onclick="changePosQuantity('${posEscape(item.key)}',-1)">−</button>
              <b>${Number(item.quantity || 0)}</b>
              <button type="button" onclick="changePosQuantity('${posEscape(item.key)}',1)">+</button>
            </div>
          </div>
          <div class="pos-line-total">
            <strong>${posMoney(subtotal)}</strong>
            <button type="button" class="pos-remove" onclick="removePosItem('${posEscape(item.key)}')">Eliminar</button>
          </div>
        </div>
      `;
    }).join("");
  }

  const total = getPosTotal();
  posEl("pos-total").textContent = posMoney(total);
  posEl("pos-complete-sale").disabled = posCart.length === 0;
  calculatePosChange();
}

function calculatePosChange() {
  const total = getPosTotal();
  const payment = posEl("pos-payment")?.value || "Efectivo";
  const cashField = posEl("pos-cash-field");
  const cash = Number(posEl("pos-cash")?.value || 0);

  if (cashField) cashField.style.display = payment === "Efectivo" ? "grid" : "none";
  if (payment !== "Efectivo" && posEl("pos-cash")) posEl("pos-cash").value = "";

  const change = payment === "Efectivo" ? Math.max(0, cash - total) : 0;
  posEl("pos-change").textContent = posMoney(change);
}

async function completePosSale(event) {
  event.preventDefault();

  if (!posCart.length) {
    posToast("Agrega al menos un producto.");
    return;
  }

  const paymentMethod = posEl("pos-payment").value;
  const total = getPosTotal();
  const amountReceived = paymentMethod === "Efectivo"
    ? Number(posEl("pos-cash").value || 0)
    : null;

  if (paymentMethod === "Efectivo" && amountReceived < total) {
    posToast("El efectivo recibido es menor al total.");
    posEl("pos-cash").focus();
    return;
  }

  const button = posEl("pos-complete-sale");
  button.disabled = true;
  button.textContent = "REGISTRANDO...";

  try {
    const payload = {
      customerName: posEl("pos-customer").value.trim(),
      paymentMethod,
      amountReceived,
      notes: posEl("pos-notes").value.trim(),
      items: posCart.map(item => ({
        product_id: item.productId,
        quantity: Number(item.quantity || 0),
        size: item.size || ""
      }))
    };

    const { data, error } = await window.urbanSupabase.rpc("create_pos_sale", { payload });
    if (error) throw error;

    posLastSale = data;
    posCart = [];
    posEl("pos-sale-form").reset();
    posEl("pos-payment").value = "Efectivo";
    renderPosCart();

    await Promise.all([loadPosProducts(), loadPosHistory()]);

    const changeText = Number(data.changeDue || 0) > 0
      ? ` · Cambio ${posMoney(data.changeDue)}`
      : "";

    posToast(`Venta #${data.folio} registrada por ${posMoney(data.total)}${changeText}`);

    if (confirm(`Venta #${data.folio} registrada correctamente.\n\nTotal: ${posMoney(data.total)}${changeText}\n\n¿Imprimir ticket?`)) {
      printPosTicket(data);
    }
  } catch (error) {
    console.error("Error registrando venta POS:", error);
    alert("No se pudo registrar la venta.\n\n" + (error?.message || "Error desconocido."));
  } finally {
    button.disabled = posCart.length === 0;
    button.textContent = "COBRAR VENTA";
  }
}

async function loadPosHistory() {
  const { data, error } = await window.urbanSupabase
    .from("pos_sales")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  const sales = data || [];
  renderPosHistory(sales);

  const now = new Date();
  const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today = sales.filter(sale => new Date(sale.created_at) >= localStart);
  const totalToday = today.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  posEl("pos-today-count").textContent = today.length;
  posEl("pos-today-total").textContent = posMoney(totalToday);
}

function renderPosHistory(sales) {
  const container = posEl("pos-history");
  if (!container) return;

  if (!sales.length) {
    container.innerHTML = '<div class="pos-empty">Todavía no hay ventas físicas registradas.</div>';
    return;
  }

  container.innerHTML = sales.map(sale => {
    const date = new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(sale.created_at));
    const itemCount = Array.isArray(sale.items)
      ? sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      : 0;

    return `
      <article class="pos-sale-card">
        <div class="pos-sale-folio">#${sale.folio}</div>
        <div class="pos-sale-info">
          <strong>${posEscape(sale.customer_name || "Venta mostrador")}</strong>
          <small>${posEscape(date)} · ${posEscape(sale.payment_method)} · ${itemCount} pieza${itemCount === 1 ? "" : "s"}</small>
        </div>
        <div class="pos-sale-total">
          <strong>${posMoney(sale.total)}</strong>
          <button type="button" onclick="printPosTicketById('${posEscape(sale.id)}')">Imprimir ticket</button>
        </div>
      </article>
    `;
  }).join("");
}

async function printPosTicketById(id) {
  const { data, error } = await window.urbanSupabase
    .from("pos_sales")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return alert("No se pudo cargar el ticket.");
  printPosTicket({
    id: data.id,
    folio: data.folio,
    created_at: data.created_at,
    customerName: data.customer_name,
    paymentMethod: data.payment_method,
    items: data.items,
    total: data.total,
    amountReceived: data.amount_received,
    changeDue: data.change_due,
    notes: data.notes
  });
}

function printPosTicket(sale) {
  const win = window.open("", "_blank", "width=420,height=700");
  if (!win) {
    alert("El navegador bloqueó la ventana del ticket.");
    return;
  }

  const items = Array.isArray(sale.items) ? sale.items : [];
  const created = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(sale.created_at || Date.now()));

  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket #${sale.folio}</title><style>body{font-family:monospace;width:300px;margin:20px auto;color:#000}h1,p{text-align:center}hr{border:0;border-top:1px dashed #000}.row{display:flex;justify-content:space-between;gap:10px;margin:7px 0}.total{font-size:18px;font-weight:bold}.muted{font-size:11px}button{width:100%;padding:10px;margin-top:18px}@media print{button{display:none}}</style></head><body><h1>URBAN SOCIETY</h1><p>VENTA EN TIENDA FÍSICA</p><p class="muted">Folio #${sale.folio}<br>${posEscape(created)}</p><hr>${items.map(item => `<div><b>${posEscape(item.name || "Producto")}</b>${item.size ? `<br><span class="muted">Talla: ${posEscape(item.size)}</span>` : ""}<div class="row"><span>${Number(item.quantity || 0)} × ${posMoney(item.price)}</span><span>${posMoney(item.subtotal)}</span></div></div>`).join("")}<hr><div class="row total"><span>TOTAL</span><span>${posMoney(sale.total)}</span></div><div class="row"><span>Pago</span><span>${posEscape(sale.paymentMethod || "")}</span></div>${sale.amountReceived != null ? `<div class="row"><span>Recibido</span><span>${posMoney(sale.amountReceived)}</span></div><div class="row"><span>Cambio</span><span>${posMoney(sale.changeDue)}</span></div>` : ""}${sale.customerName ? `<p class="muted">Cliente: ${posEscape(sale.customerName)}</p>` : ""}<hr><p>¡Gracias por tu compra!</p><button onclick="window.print()">IMPRIMIR</button></body></html>`);
  win.document.close();
  win.focus();
}

async function refreshPos() {
  try {
    await Promise.all([loadPosProducts(), loadPosHistory()]);
    posToast("Punto de venta actualizado.");
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar el punto de venta.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await verificarOwner();
  if (!allowed) return;

  posEl("pos-search")?.addEventListener("input", renderPosProducts);
  posEl("pos-refresh")?.addEventListener("click", refreshPos);
  posEl("pos-clear")?.addEventListener("click", clearPosCart);
  posEl("pos-payment")?.addEventListener("change", calculatePosChange);
  posEl("pos-cash")?.addEventListener("input", calculatePosChange);
  posEl("pos-sale-form")?.addEventListener("submit", completePosSale);

  try {
    await Promise.all([loadPosProducts(), loadPosHistory()]);
    calculatePosChange();
  } catch (error) {
    console.error("Error iniciando POS:", error);
    alert("No se pudo cargar el punto de venta.\n\n" + (error?.message || "Error desconocido."));
  }
});

window.addPosProduct = addPosProduct;
window.changePosQuantity = changePosQuantity;
window.removePosItem = removePosItem;
window.printPosTicketById = printPosTicketById;
