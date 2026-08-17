/* =========================================================
   URBAN SOCIETY
   BACKENDLESS.JS
   Inicialización, sesión y compatibilidad de interfaz
========================================================= */

let backendlessReady = false;

function cargarEstilosMejorados() {
  const estilos = ["css/upgrade.css", "css/contact-form.css"];

  estilos.forEach(href => {
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
}

function iniciarBackendless() {
  if (backendlessReady) return true;

  if (typeof Backendless === "undefined") {
    console.error("Backendless SDK no está cargado.");
    return false;
  }

  if (typeof BACKENDLESS_CONFIG === "undefined") {
    console.error("BACKENDLESS_CONFIG no está definido.");
    return false;
  }

  try {
    Backendless.initApp(
      BACKENDLESS_CONFIG.APPLICATION_ID,
      BACKENDLESS_CONFIG.JS_API_KEY
    );
    backendlessReady = true;
    console.info("Backendless conectado.");
    return true;
  } catch (error) {
    console.error("No se pudo iniciar Backendless:", error);
    return false;
  }
}

async function obtenerUsuarioActual() {
  if (!iniciarBackendless()) return null;

  try {
    return await Backendless.UserService.getCurrentUser();
  } catch (error) {
    console.warn("No se pudo recuperar la sesión:", error);
    return null;
  }
}

async function comprobarSesionBackendless() {
  return Boolean(await obtenerUsuarioActual());
}

async function verificarOwner() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    alert("Debes iniciar sesión para entrar al panel.");
    window.location.replace("UrbanSociety.html");
    return false;
  }

  const email = String(usuario.email || "").trim().toLowerCase();
  const ownerEmail = String(
    typeof OWNER_EMAIL !== "undefined" ? OWNER_EMAIL : ""
  ).trim().toLowerCase();

  if (!ownerEmail || email !== ownerEmail) {
    alert("Acceso denegado. Esta sección es únicamente para el propietario.");
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
    console.error("No se pudo cerrar la sesión:", error);
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

  select.innerHTML = '<option value="">Todas las categorías</option>' +
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
      <p class="eyebrow">MENSAJE DIRECTO</p>
      <h3>¿Tienes una pregunta?</h3>
      <p class="muted">Escríbenos sobre disponibilidad, productos o pedidos.</p>
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
        <label for="contact-phone">WhatsApp / teléfono</label>
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
    return;
  }

  if (!endpoint || !/^https:\/\/formspree\.io\/f\//i.test(endpoint)) {
    if (status) {
      status.textContent = "Falta conectar el endpoint de Formspree.";
      status.className = "contact-status error";
    }
    return;
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
      throw new Error("Formspree rechazó el envío.");
    }

    form.reset();

    if (status) {
      status.textContent = "✓ Mensaje enviado correctamente. Te responderemos pronto.";
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
      menuButton.textContent = abierto ? "×" : "☰";
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "☰";
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
