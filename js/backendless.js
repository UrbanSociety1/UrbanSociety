/* =========================================================
   URBAN SOCIETY
   BACKENDLESS.JS
   Inicialización, sesión y compatibilidad de interfaz
========================================================= */

let backendlessReady = false;

function cargarEstilosMejorados() {
  if (document.querySelector('link[href="css/upgrade.css"]')) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "css/upgrade.css";
  document.head.appendChild(link);
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
