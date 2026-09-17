/* =========================================================
   URBAN SOCIETY
   BACKENDLESS REAL BACKEND
   =========================================================

   Esta versiÃ³n NO utiliza Supabase.

   Utiliza directamente:

   - Backendless SDK
   - Backendless User Service
   - Backendless Data Service
   - Backendless File Service

   AdemÃ¡s mantiene una pequeÃ±a capa de compatibilidad




    con el cÃ³digo antiguo de Urban Society.
  ========================================================= */


  "use strict";


  /* =======================================================
     EVITAR CARGAR EL BACKEND DOS VECES
  ======================================================= */

  if (window.__urbanBackendlessInstalled) { console.warn("Urban Society: Backendless ya estaba instalado."); } else { window.__urbanBackendlessInstalled = true; }

  window.__urbanBackendlessInstalled = true;


  /* =======================================================
     COMPROBAR SDK
  ======================================================= */

  if (typeof window.Backendless === "undefined") { console.error("ERROR: El SDK de Backendless no estÃ¡ cargado."); }


  /* =======================================================
     COMPROBAR CONFIGURACIÃ“N
  ======================================================= */

  if (
    typeof window.BACKENDLESS_CONFIG === "undefined"
  ) {

    console.error(
      "ERROR: BACKENDLESS_CONFIG no estÃ¡ definido."
    );

  }


  /* =======================================================
     CONFIGURACIÃ“N
  ======================================================= */

  const CONFIG = window.BACKENDLESS_CONFIG;


  /* =======================================================
     INICIALIZAR BACKENDLESS
  ======================================================= */

  try {

    Backendless.initApp(
      CONFIG.SUBDOMAIN
    );

    console.info(
      "Urban Society conectado a Backendless."
    );

    console.info(
      "Backend:",
      CONFIG.SUBDOMAIN
    );

  } catch (error) {

    console.error(
      "ERROR inicializando Backendless:",
      error
    );

    
  }


  /* =======================================================
     FECHAS
  ======================================================= */

  function fechaMs(value) {

    if (!value) {
      return null;
    }

    const time = new Date(value).getTime();

    return Number.isFinite(time)
      ? time
      : null;
  }


  /* =======================================================
     USUARIO
  ======================================================= */

  function usuarioLegacy(user) {

    if (!user) {
      return null;
    }

    return {

      objectId:
        user.objectId ||
        user.id ||
        "",

      id:
        user.objectId ||
        user.id ||
        "",

      email:
        user.email ||
        "",

      name:
        user.name ||
        user.fullName ||
        user.username ||
        "",

      phone:
        user.phone ||
        user.phoneNumber ||
        "",

      username:
        user.username ||
        "",

      userToken:
        user["user-token"] ||
        user.userToken ||
        ""

    };
  }


  /* =======================================================
     PRODUCTO
  ======================================================= */

  function productoLegacy(row) {

    if (!row) {
      return row;
    }

    return {

      objectId:
        row.objectId ||
        row.id ||
        "",

      id:
        row.objectId ||
        row.id ||
        "",

      created:
        fechaMs(row.created),

      updated:
        fechaMs(row.updated),

      name:
        row.name || "",

      category:
        row.category || "General",

      description:
        row.description || "",

      image:
        row.image ||
        row.imageUrl ||
        "",

      imageUrl:
        row.imageUrl ||
        row.image ||
        "",

      price:
        Number(row.price || 0),

      stock:
        Number(row.stock || 0),

      sizes:
        String(row.sizes || ""),

      sku:
        String(row.sku || ""),

      barcode:
        String(row.barcode || ""),

      active:
        row.active !== false

    };
  }


  /* =======================================================
     PEDIDO
  ======================================================= */

  function pedidoLegacy(row) {

    if (!row) {
      return row;
    }

    return {

      objectId:
        row.objectId ||
        row.id ||
        "",

      id:
        row.objectId ||
        row.id ||
        "",

      created:
        fechaMs(row.created),

      updated:
        fechaMs(row.updated),

      customerName:
        row.customerName || "",

      customerEmail:
        row.customerEmail || "",

      customerPhone:
        row.customerPhone || "",

      address:
        row.address || "",

      paymentMethod:
        row.paymentMethod || "",

      products:
        row.products || [],

      total:
        Number(row.total || 0),

      status:
        row.status || "pending",

      userId:
        row.userId ||
        row.ownerId ||
        null,

    };
  }


  /* =======================================================
     NOMBRE DE TABLA
  ======================================================= */

  function nombreTabla(tableName) {

    const name =
      String(tableName || "")
        .toLowerCase()
        .trim();


    if (
      name === "products" ||
      name === "product"
    ) {

      return CONFIG.TABLES.PRODUCTS;
    }


    if (
      name === "orders" ||
      name === "order" ||
      name === "pedidos"
    ) {

      return CONFIG.TABLES.ORDERS;
    }


    return tableName;
  }

  async function verificarOwner() {
    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
      alert("Debes iniciar sesiÃ³n para acceder a esta secciÃ³n.");
      return false;
    }

  const email = String(usuario.email || "").trim().toLowerCase();
  const ownerEmail = String(
    typeof OWNER_EMAIL !== "undefined" ? OWNER_EMAIL : ""
  ).trim().toLowerCase();

  if (!ownerEmail || email !== ownerEmail) {
    alert("Acceso denegado. Esta secciÃ³n es Ãºnicamente para el propietario.");
    window.location.replace("UrbanSociety.html");
    return false;
  }

  return true;
}

async function cerrarSesionBackendless() {
  if (!iniciarBackendless()) return false;

  try {
    await Backendless.UserService.logout();
    return true;
  } catch (error) {
    console.error("No se pudo cerrar la sesiÃ³n:", error);
    return false;
  }
}

function actualizarCategoriasUI() {
  const select = document.getElementById("category-filter");
  if (!select || typeof productosUrban === "undefined") return;

  const actual = select.value;
  const categorias = [...new Set(
    productosUrban
      .map(producto => String(producto.category || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));

  select.innerHTML = '<option value="">Todas las categorÃ­as</option>' +
    categorias.map(categoria => {
      const segura = typeof escaparHTML === "function"
        ? escaparHTML(categoria)
        : categoria.replace(/[&<>"']/g, "");
      return `<option value="${segura}">${segura}</option>`;
    }).join("");

  if (categorias.includes(actual)) select.value = actual;
}

function crearFormularioContacto() {
  const seccion = document.getElementById("contacto");
  if (!seccion || seccion.querySelector("#contact-form")) return;

  const tarjeta = seccion.querySelector(".contact-card");
  if (!tarjeta) return;

  tarjeta.innerHTML = `
    <div class="contact-copy">
      <div class="contact-copy-content">
        <p class="eyebrow">MENSAJE DIRECTO</p>
        <h3>Â¿Tienes una pregunta?</h3>
        <p class="muted">EscrÃ­benos sobre disponibilidad, productos o pedidos.</p>
      </div>
    </div>

    <form id="contact-form" class="contact-form" novalidate>
      <div class="contact-field">
        <label for="contact-name">Nombre</label>
        <input id="contact-name" name="name" type="text" autocomplete="name" maxlength="100" required>
      </div>

      <div class="contact-field">
        <label for="contact-email">Correo</label>
        <input id="contact-email" name="email" type="email" autocomplete="email" required>
      </div>

      <div class="contact-field full">
        <label for="contact-phone">WhatsApp / telÃ©fono</label>
        <input id="contact-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="25">
      </div>

      <div class="contact-field full">
        <label for="contact-message">Mensaje</label>
        <textarea id="contact-message" name="message" rows="5" maxlength="1200" required></textarea>
      </div>

      <input type="text" name="_gotcha" class="contact-honeypot" tabindex="-1" autocomplete="off">

      <button id="contact-submit" type="submit" class="btn btn-primary full contact-submit">
        ENVIAR MENSAJE
      </button>

      <p id="contact-status" class="contact-status" aria-live="polite"></p>
    </form>
  `;

  const form = document.getElementById("contact-form");
  if (form) form.addEventListener("submit", enviarFormularioContacto);
}

async function enviarFormularioContacto(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("contact-status");
  const button = document.getElementById("contact-submit");
  const endpoint = String(window.FORMSPREE_ENDPOINT || "").trim();

  if (!form.checkValidity()) {
    form.reportValidity();
  }

  if (!endpoint || !/^https:\/\/formspree\.io\/f\//i.test(endpoint)) {
    if (status) {
      status.textContent = "Falta conectar el endpoint de Formspree.";
      status.className = "contact-status error";
    }
  }

  const textoOriginal = button ? button.textContent : "";

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "ENVIANDO...";
    }

    if (status) {
      status.textContent = "Enviando mensaje...";
      status.className = "contact-status";
    }

    const respuesta = await fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      headers: {
        Accept: "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error("Formspree rechazÃ³ el envÃ­o.");
    }

    form.reset();

    if (status) {
      status.textContent = "âœ“ Mensaje enviado correctamente. Te responderemos pronto.";
      status.className = "contact-status success";
    }
  } catch (error) {
    console.error("Error enviando formulario de contacto:", error);

    if (status) {
      status.textContent = "No se pudo enviar el mensaje. Intenta nuevamente.";
      status.className = "contact-status error";
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = textoOriginal || "ENVIAR MENSAJE";
    }
  }
}

function prepararInterfaz() {
  ["login-screen", "register-screen"].forEach(id => {
    const pantalla = document.getElementById(id);
    if (!pantalla) return;
    pantalla.hidden = false;
    pantalla.style.display = "none";
  });

  const cartButton = document.getElementById("cart-button");
  if (cartButton) {
    cartButton.addEventListener("click", () => {
      if (typeof abrirCarrito === "function") abrirCarrito();
    });
  }

  const menuButton = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const abierto = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(abierto));
      menuButton.textContent = abierto ? "Ã—" : "â˜°";
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "â˜°";
      });
    });
  }

  const productsGrid = document.getElementById("products-grid");
  if (productsGrid) {
    const observer = new MutationObserver(actualizarCategoriasUI);
    observer.observe(productsGrid, { childList: true });
    setTimeout(actualizarCategoriasUI, 400);
  }

  crearFormularioContacto();

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    document.querySelectorAll(".modal-overlay.active").forEach(modal => {
      modal.classList.remove("active");
    });

    const login = document.getElementById("login-screen");
    const registro = document.getElementById("register-screen");
    const tienda = document.getElementById("store-content");

    if (login) login.style.display = "none";
    if (registro) registro.style.display = "none";
    if (tienda) tienda.style.display = "block";
  });
}

cargarEstilosMejorados();
iniciarBackendless();
document.addEventListener("DOMContentLoaded", prepararInterfaz);

window.iniciarBackendless = iniciarBackendless;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.comprobarSesionBackendless = comprobarSesionBackendless;
window.verificarOwner = verificarOwner;
window.cerrarSesionBackendless = cerrarSesionBackendless;
