/* =========================================================
   URBAN SOCIETY
   ADMIN.JS - PRODUCTOS Y PEDIDOS
========================================================= */

const ADMIN_PRODUCTS_TABLE = "Products";
const ADMIN_ORDERS_TABLE = "Orders";
let adminProducts = [];
let adminOrders = [];

function adminEl(id) { return document.getElementById(id); }
function escaparAdmin(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function formatearAdminPrecio(precio) { return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(precio||0)); }
function formatearFechaAdmin(value) { if(!value)return"";const fecha=new Date(value);if(Number.isNaN(fecha.getTime()))return"";return new Intl.DateTimeFormat("es-MX",{dateStyle:"medium",timeStyle:"short"}).format(fecha); }
function normalizarTallasAdmin(value) { return [...new Set(String(value||"").split(/[,;|]+/).map(v=>v.trim()).filter(Boolean))].join(", "); }
function mostrarNotificacionAdmin(mensaje) { if(typeof mostrarNotificacion==="function")mostrarNotificacion(mensaje);else if(typeof posToast==="function")posToast(mensaje);else alert(mensaje); }

function instalarEstilosAdminMejorados(){
  if(document.getElementById("urban-admin-upgrade-styles"))return;
  const style=document.createElement("style");style.id="urban-admin-upgrade-styles";style.textContent=`
    .admin-product-card{position:relative}.admin-product-card.is-inactive{opacity:.62}.admin-product-badges{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.admin-badge{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:800;border:1px solid #383838;background:#202020;color:#ddd}.admin-badge.active{color:#91ffc0;border-color:rgba(80,225,140,.35);background:rgba(80,225,140,.08)}.admin-badge.inactive{color:#ff8c98;border-color:rgba(255,70,90,.35);background:rgba(255,70,90,.08)}.admin-badge.low{color:#ffd58a;border-color:rgba(255,190,70,.35)}.admin-help{color:#777;font-size:12px;line-height:1.45}.admin-toggle{display:flex;align-items:center;gap:12px;min-height:47px;padding:10px 12px;border:1px solid #333;border-radius:10px;background:#181818}.admin-toggle input{width:20px!important;height:20px;margin:0;padding:0;accent-color:#ff1027}.admin-toggle label{margin:0;cursor:pointer}.admin-product-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#999;font-size:11px;word-break:break-all}.admin-order-products{display:grid;gap:8px;margin:14px 0;padding:0;list-style:none}.admin-order-products li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #292929;border-radius:9px;background:#101010}.admin-order-product-main{display:grid;gap:3px}.admin-order-product-main small{color:#999}.admin-order-date{color:#777!important;font-size:12px}.admin-order-header{align-items:flex-start}@media(max-width:650px){.admin-order-products li{align-items:flex-start;flex-direction:column}.admin-order-products li>strong{align-self:flex-end}}
  `;document.head.appendChild(style);
}

function instalarCamposAvanzadosProducto(){
  const form=adminEl("product-form"),description=adminEl("product-description");
  if(!form||!description)return;
  const descriptionGroup=description.closest(".form-group");
  if(!adminEl("product-sizes")){
    const group=document.createElement("div");group.className="form-group";group.innerHTML='<label for="product-sizes">Tallas disponibles</label><input id="product-sizes" type="text" placeholder="Ej. 23, 24, 25"><small class="admin-help">Sepáralas con comas. Si está vacío, no se pedirá talla.</small>';form.insertBefore(group,descriptionGroup);
  }
  if(!adminEl("product-active")){
    const group=document.createElement("div");group.className="form-group";group.innerHTML='<label>Visibilidad</label><div class="admin-toggle"><input id="product-active" type="checkbox" checked><label for="product-active">Producto activo y visible en la tienda</label></div>';form.insertBefore(group,descriptionGroup);
  }
}

async function cargarProductosAdmin() {
  const container = adminEl("admin-products");

  if (container) {
    container.innerHTML =
      '<div class="empty-products">Cargando productos...</div>';
  }

  try {
    const response = await fetch(`${window.API_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    adminProducts = Array.isArray(data.products)
      ? data.products
      : [];

      adminProducts = adminProducts.map(producto => ({
  ...producto,
  objectId: producto.id
}));

    mostrarProductosAdmin(adminProducts);
    actualizarEstadisticasAdmin();

  } catch (error) {
    console.error("Error cargando productos:", error);

    if (container) {
      container.innerHTML =
        '<div class="empty-products">No se pudieron cargar los productos.</div>';
    }
  }
}

function mostrarProductosAdmin(productos){const container=adminEl("admin-products");if(!container)return;if(!productos.length){container.innerHTML='<div class="empty-products"><h3>No hay productos</h3><p>Agrega tu primer producto.</p></div>';return;}container.innerHTML=productos.map(tarjetaProductoAdmin).join("");}
function tarjetaProductoAdmin(producto){
  const id=escaparAdmin(producto.objectId||""),nombre=escaparAdmin(producto.name||"Sin nombre"),categoria=escaparAdmin(producto.category||"General"),precio=Number(producto.price||0),stock=Number(producto.stock||0),imagen=escaparAdmin(producto.image||producto.imageUrl||"images/Logo Urban.png"),tallas=normalizarTallasAdmin(producto.sizes),activo=producto.active!==false,sku=escaparAdmin(producto.sku||""),barcode=escaparAdmin(producto.barcode||"");
  return `<div class="admin-product-card ${activo?"":"is-inactive"}"><img src="${imagen}" alt="${nombre}" onerror="this.src='images/Logo Urban.png'"><div class="admin-product-info"><span>${categoria}</span><h3>${nombre}</h3><strong>${formatearAdminPrecio(precio)}</strong><div class="admin-product-badges"><span class="admin-badge ${activo?"active":"inactive"}">${activo?"● Activo":"● Inactivo"}</span><span class="admin-badge ${stock<=5?"low":""}">Stock: ${stock}</span></div>${sku?`<p class="admin-product-code"><b>SKU:</b> ${sku}</p>`:""}${barcode?`<p class="admin-product-code"><b>Código:</b> ${barcode}</p>`:""}${tallas?`<p><b>Tallas:</b> ${escaparAdmin(tallas)}</p>`:'<p><b>Tallas:</b> No aplica</p>'}<div class="admin-product-actions"><button type="button" onclick="editarProductoAdmin('${id}')">✏️ Editar</button><button type="button" onclick="eliminarProductoAdmin('${id}')">🗑️ Eliminar</button></div></div></div>`;
}

function mostrarVistaPrevia(event){const archivo=event.target.files?.[0],preview=adminEl("image-preview"),container=adminEl("image-preview-container"),status=adminEl("image-upload-status");if(!archivo){if(container)container.style.display="none";return;}if(!archivo.type.startsWith("image/")){alert("Selecciona una imagen válida.");event.target.value="";return;}if(archivo.size>5*1024*1024){alert("La imagen no puede superar 5 MB.");event.target.value="";return;}const reader=new FileReader();reader.onload=()=>{if(preview)preview.src=reader.result;if(container)container.style.display="block";};reader.readAsDataURL(archivo);if(status)status.textContent=archivo.name;}
async function subirImagenProducto(){const input=adminEl("product-image-file"),archivo=input?.files?.[0];if(!archivo)return null;const status=adminEl("image-upload-status");if(status)status.textContent="Subiendo fotografía...";const nombreSeguro=archivo.name.replace(/[^a-zA-Z0-9._-]/g,"_"),ruta=`products/${Date.now()}_${nombreSeguro}`;try{const resultado=await Backendless.Files.upload(archivo,ruta,true),url=resultado?.fileURL||resultado?.url;if(!url)throw new Error("Backendless no devolvió la URL de la imagen.");if(status)status.textContent="✓ Fotografía subida correctamente.";return url;}catch(error){if(status)status.textContent="Error al subir la fotografía.";throw error;}}
function limpiarCamposVisualesProducto(){["product-id","product-image","product-sizes","product-sku","product-barcode"].forEach(id=>{if(adminEl(id))adminEl(id).value="";});if(adminEl("product-active"))adminEl("product-active").checked=true;const pc=adminEl("image-preview-container");if(pc)pc.style.display="none";const p=adminEl("image-preview");if(p)p.removeAttribute("src");const status=adminEl("image-upload-status");if(status)status.textContent="Selecciona una fotografía desde tu computadora.";const submit=adminEl("product-form")?.querySelector("button[type='submit']");if(submit)submit.textContent="Agregar producto";}
function limpiarFormularioProducto(){const form=adminEl("product-form");if(form)form.reset();limpiarCamposVisualesProducto();}

async function guardarProductoAdmin(event){
  event.preventDefault();
  const objectId=adminEl("product-id")?.value.trim()||"",name=adminEl("product-name")?.value.trim()||"",price=Number(adminEl("product-price")?.value||0),category=adminEl("product-category")?.value.trim()||"Otros",stock=Number(adminEl("product-stock")?.value||0),description=adminEl("product-description")?.value.trim()||"",sizes=normalizarTallasAdmin(adminEl("product-sizes")?.value||""),sku=adminEl("product-sku")?.value.trim()||"",barcode=adminEl("product-barcode")?.value.trim()||"",active=adminEl("product-active")?.checked!==false;let image=adminEl("product-image")?.value.trim()||"";
  if(!name)return alert("Escribe el nombre del producto.");if(!Number.isFinite(price)||price<0)return alert("Escribe un precio válido.");if(!Number.isInteger(stock)||stock<0)return alert("Escribe un stock válido.");
  const submit=event.target.querySelector("button[type='submit']");if(submit){submit.disabled=true;submit.textContent=objectId?"Guardando cambios...":"Agregando...";}
  try{if(adminEl("product-image-file")?.files?.[0])image=await subirImagenProducto();const producto={name,price,category,stock,image,description,sizes,sku,barcode,active};if(objectId)producto.objectId=objectId;await Backendless.Data.of(ADMIN_PRODUCTS_TABLE).save(producto);mostrarNotificacionAdmin(objectId?"Producto actualizado.":"Producto agregado.");limpiarFormularioProducto();await cargarProductosAdmin();window.refreshUrbanAlerts?.();}
  catch(error){console.error("Error guardando producto:",error);const msg=String(error.message||"");alert((/duplicate|unique/i.test(msg)?"El SKU o código de barras ya está usado por otro producto.":"No se pudo guardar el producto.")+"\n\n"+msg);}
  finally{if(submit){submit.disabled=false;submit.textContent=objectId?"Guardar cambios":"Agregar producto";}}
}
function editarProductoAdmin(id){const producto=adminProducts.find(item=>item.objectId===id);if(!producto)return alert("Producto no encontrado.");const vals={"product-id":producto.objectId||"","product-name":producto.name||"","product-price":producto.price??0,"product-category":producto.category||"","product-stock":producto.stock??0,"product-image":producto.image||producto.imageUrl||"","product-description":producto.description||"","product-sizes":producto.sizes||"","product-sku":producto.sku||"","product-barcode":producto.barcode||""};Object.entries(vals).forEach(([id,v])=>{if(adminEl(id))adminEl(id).value=v;});if(adminEl("product-active"))adminEl("product-active").checked=producto.active!==false;const fi=adminEl("product-image-file");if(fi)fi.value="";const preview=adminEl("image-preview"),pc=adminEl("image-preview-container"),actual=producto.image||producto.imageUrl||"";if(actual&&preview&&pc){preview.src=actual;pc.style.display="block";}const submit=adminEl("product-form")?.querySelector("button[type='submit']");if(submit)submit.textContent="Guardar cambios";adminEl("product-form")?.scrollIntoView({behavior:"smooth",block:"start"});}
async function eliminarProductoAdmin(id){const producto=adminProducts.find(item=>item.objectId===id);if(!producto||!confirm(`¿Eliminar "${producto.name||"este producto"}"? Esta acción no se puede deshacer.`))return;try{await Backendless.Data.of(ADMIN_PRODUCTS_TABLE).remove(id);mostrarNotificacionAdmin("Producto eliminado.");await cargarProductosAdmin();window.refreshUrbanAlerts?.();}catch(error){console.error(error);alert("No se pudo eliminar el producto.\n\n"+(error.message||"Error desconocido."));}}

async function cargarPedidosAdmin(){const container=adminEl("admin-orders");if(container)container.innerHTML='<div class="empty-products">Cargando pedidos...</div>';try{const query=Backendless.DataQueryBuilder.create().setSortBy(["created DESC"]);adminOrders=await Backendless.Data.of(ADMIN_ORDERS_TABLE).find(query)||[];mostrarPedidosAdmin(adminOrders);actualizarEstadisticasAdmin();}catch(error){console.error("Error cargando pedidos:",error);if(container)container.innerHTML='<div class="empty-products">No se pudieron cargar los pedidos.</div>';}}
function mostrarPedidosAdmin(pedidos){const container=adminEl("admin-orders");if(!container)return;if(!pedidos.length){container.innerHTML='<div class="empty-products"><h3>No hay pedidos</h3><p>Los nuevos pedidos aparecerán aquí.</p></div>';return;}container.innerHTML=pedidos.map(tarjetaPedidoAdmin).join("");}
function parsearProductosAdmin(value){if(Array.isArray(value))return value;try{const parsed=JSON.parse(value||"[]");return Array.isArray(parsed)?parsed:[];}catch(_){return[];}}
function tarjetaPedidoAdmin(pedido){const id=escaparAdmin(pedido.objectId||""),nombre=escaparAdmin(pedido.customerName||"Cliente"),email=escaparAdmin(pedido.customerEmail||""),telefono=escaparAdmin(pedido.customerPhone||""),direccion=escaparAdmin(pedido.address||""),metodo=escaparAdmin(pedido.paymentMethod||"No especificado"),estado=String(pedido.status||"Pendiente"),total=Number(pedido.total||0),fecha=formatearFechaAdmin(pedido.created),estados=["Pendiente","Confirmado","Preparando","Enviado","Entregado","Cancelado"],productos=parsearProductosAdmin(pedido.products);const productosHtml=productos.length?`<ul class="admin-order-products">${productos.map(producto=>{const cantidad=Number(producto.quantity||0),precio=Number(producto.price||0),subtotal=Number(producto.subtotal||precio*cantidad),talla=String(producto.size||"").trim(),sku=String(producto.sku||"").trim();return `<li><div class="admin-order-product-main"><strong>${cantidad} × ${escaparAdmin(producto.name||"Producto")}</strong>${talla?`<small>Talla: ${escaparAdmin(talla)}</small>`:""}${sku?`<small>SKU: ${escaparAdmin(sku)}</small>`:""}</div><strong>${formatearAdminPrecio(subtotal)}</strong></li>`;}).join("")}</ul>`:"";return `<div class="admin-order-card"><div class="admin-order-header"><div><strong>Pedido #${id}</strong>${fecha?`<p class="admin-order-date">${escaparAdmin(fecha)}</p>`:""}</div><span class="order-status">${escaparAdmin(estado)}</span></div><div class="admin-order-body"><p><b>Cliente:</b> ${nombre}</p><p><b>Email:</b> ${email}</p><p><b>Teléfono:</b> ${telefono}</p><p><b>Dirección:</b> ${direccion}</p><p><b>Pago:</b> ${metodo}</p>${productosHtml}<p><b>Total:</b> ${formatearAdminPrecio(total)}</p><label>Estado del pedido</label><select onchange="cambiarEstadoPedido('${id}',this.value)">${estados.map(item=>`<option value="${item}" ${item===estado?"selected":""}>${item}</option>`).join("")}</select></div></div>`;}
async function cambiarEstadoPedido(id,estado){
  try{
    if(!id) throw new Error("El pedido no tiene un identificador válido.");
    if(!estado) throw new Error("El estado del pedido no es válido.");

    const pedido=adminOrders.find(item=>String(item.objectId||"")===String(id));

    if(!pedido) throw new Error("No se encontró el pedido.");

    pedido.status=estado;

    await Backendless.Data.of(ADMIN_ORDERS_TABLE).save({
      objectId:id,
      status:estado
    });

    mostrarNotificacionAdmin("Estado actualizado correctamente.");
    await cargarPedidosAdmin();
    window.refreshUrbanAlerts?.();

  }catch(error){
    console.error("Error actualizando estado del pedido:",error);
    alert("No se pudo actualizar el pedido.\\n\\n"+(error.message||"Error desconocido."));
    await cargarPedidosAdmin();
  }
}

function actualizarEstadisticasAdmin(){const pc=adminEl("admin-products-count"),oc=adminEl("admin-orders-count"),vt=adminEl("admin-sales-total");if(pc)pc.textContent=adminProducts.length;if(oc)oc.textContent=adminOrders.length;if(vt)vt.textContent=formatearAdminPrecio(adminOrders.reduce((s,p)=>p.status==="Cancelado"?s:s+Number(p.total||0),0));}

async function initAdminPage(){
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  instalarEstilosAdminMejorados();
  if(page==='products.html'){
    if(await window.verificarAcceso?.('products')===false)return;
    instalarCamposAvanzadosProducto();
    const form=adminEl("product-form");form?.addEventListener("submit",guardarProductoAdmin);form?.addEventListener("reset",()=>setTimeout(limpiarCamposVisualesProducto,0));adminEl("product-image-file")?.addEventListener("change",mostrarVistaPrevia);await cargarProductosAdmin();
  }else if(page==='orders.html'){
    if(await window.verificarAcceso?.('orders')===false)return;
    await cargarPedidosAdmin();
  }
}
document.addEventListener("DOMContentLoaded",initAdminPage);

window.cargarProductosAdmin=cargarProductosAdmin;window.cargarPedidosAdmin=cargarPedidosAdmin;window.editarProductoAdmin=editarProductoAdmin;window.eliminarProductoAdmin=eliminarProductoAdmin;window.cambiarEstadoPedido=cambiarEstadoPedido;window.actualizarEstadisticasAdmin=actualizarEstadisticasAdmin;
