/* =========================================================
   URBAN SOCIETY
   AUTH.JS
   Login, registro y sesión del propietario
========================================================= */

let usuarioActual = null;
let usuarioEsOwner = false;

const OWNER_EMAIL = "mendozaosornio010305@gmail.com";

function obtenerElemento(id) {
  return document.getElementById(id);
}

function escapeHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mostrarMensajeAuth(mensaje, tipo = "error", destino = "auth-status") {
  const elemento = obtenerElemento(destino);
  if (!elemento) return;

  elemento.textContent = mensaje;
  elemento.style.color = tipo === "success" ? "#43e883" : "#ff5162";
}

function limpiarMensajesAuth() {
  ["auth-status", "register-status"].forEach(id => {
    const elemento = obtenerElemento(id);
    if (elemento) elemento.textContent = "";
  });
}

function mostrarPantallaAuth(idVisible) {
  const tienda = obtenerElemento("store-content");
  const login = obtenerElemento("login-screen");
  const registro = obtenerElemento("register-screen");

  if (tienda) tienda.style.display = "none";
  if (login) login.style.display = idVisible === "login-screen" ? "flex" : "none";
  if (registro) registro.style.display = idVisible === "register-screen" ? "flex" : "none";

  limpiarMensajesAuth();
  window.scrollTo(0, 0);
}

function mostrarLogin() {
  mostrarPantallaAuth("login-screen");
}

function mostrarRegistro() {
  mostrarPantallaAuth("register-screen");
}

function mostrarTienda() {
  const tienda = obtenerElemento("store-content");
  const login = obtenerElemento("login-screen");
  const registro = obtenerElemento("register-screen");

  if (login) login.style.display = "none";
  if (registro) registro.style.display = "none";
  if (tienda) tienda.style.display = "block";

  limpiarMensajesAuth();
}

function detectarPropietario(usuario) {
  const email = String(usuario?.email || "").trim().toLowerCase();
  usuarioEsOwner = Boolean(email && email === OWNER_EMAIL.toLowerCase());
  return usuarioEsOwner;
}

function actualizarAreaUsuario() {
  const area = obtenerElemento("user-area");
  if (!area) return;

  if (!usuarioActual) {
    area.innerHTML = '<button type="button" class="account-button" onclick="mostrarLogin()">👤 Cuenta</button>';
    return;
  }

  const nombre = escapeHTML(usuarioActual.name || usuarioActual.email || "Usuario");

  area.innerHTML = `
    <button type="button" class="account-button" onclick="mostrarMenuCuenta()">
      👤 <span>${nombre}</span>
    </button>
  `;
}

function mostrarMenuCuenta() {
  const existente = obtenerElemento("account-menu");
  if (existente) {
    existente.remove();
    return;
  }

  if (!usuarioActual) {
    mostrarLogin();
    return;
  }

  const menu = document.createElement("div");
  menu.id = "account-menu";
  menu.className = "account-menu";

  const nombre = escapeHTML(usuarioActual.name || "Usuario");
  const email = escapeHTML(usuarioActual.email || "");

  menu.innerHTML = `
    <div style="padding-bottom:14px;border-bottom:1px solid #292930;margin-bottom:14px">
      <strong>${nombre}</strong>
      <div style="color:#999;font-size:12px;margin-top:5px;word-break:break-word">${email}</div>
      ${usuarioEsOwner ? '<div style="color:#ff1027;font-size:12px;font-weight:900;margin-top:8px">👑 PROPIETARIO</div>' : ""}
    </div>
    ${usuarioEsOwner ? '<button type="button" class="btn btn-primary full" onclick="irAlPanelAdmin()" style="margin-bottom:10px">PANEL DEL PROPIETARIO</button>' : ""}
    <button type="button" class="btn btn-secondary full" onclick="cerrarSesion()">CERRAR SESIÓN</button>
  `;

  document.body.appendChild(menu);
}

function irAlPanelAdmin() {
  if (!usuarioActual) {
    mostrarLogin();
    return;
  }

  if (!usuarioEsOwner) {
    alert("No tienes permisos de propietario.");
    return;
  }

  window.location.href = "admin.html";
}

async function registrarUsuario(event) {
  event.preventDefault();

  if (typeof Backendless === "undefined" || !iniciarBackendless()) {
    mostrarMensajeAuth("Backendless no está disponible.", "error", "register-status");
    return;
  }

  const nombre = obtenerElemento("register-name")?.value.trim();
  const email = obtenerElemento("register-email")?.value.trim();
  const password = obtenerElemento("register-password")?.value || "";
  const confirmPassword = obtenerElemento("register-password-confirm")?.value || "";

  if (!nombre || !email || !password || !confirmPassword) {
    mostrarMensajeAuth("Completa todos los campos.", "error", "register-status");
    return;
  }

  if (password.length < 6) {
    mostrarMensajeAuth("La contraseña debe tener al menos 6 caracteres.", "error", "register-status");
    return;
  }

  if (password !== confirmPassword) {
    mostrarMensajeAuth("Las contraseñas no coinciden.", "error", "register-status");
    return;
  }

  mostrarMensajeAuth("Creando cuenta...", "success", "register-status");

  try {
    const user = new Backendless.User();
    user.name = nombre;
    user.email = email;
    user.password = password;

    await Backendless.UserService.register(user);

    const formulario = obtenerElemento("register-form");
    if (formulario) formulario.reset();

    mostrarMensajeAuth("Cuenta creada. Ya puedes iniciar sesión.", "success", "register-status");
    setTimeout(mostrarLogin, 900);
  } catch (error) {
    console.error("Error registrando usuario:", error);
    mostrarMensajeAuth(obtenerMensajeError(error, "No se pudo crear la cuenta."), "error", "register-status");
  }
}

async function iniciarSesion(event) {
  event.preventDefault();

  if (typeof Backendless === "undefined" || !iniciarBackendless()) {
    mostrarMensajeAuth("Backendless no está disponible.");
    return;
  }

  const email = obtenerElemento("login-email")?.value.trim();
  const password = obtenerElemento("login-password")?.value || "";

  if (!email || !password) {
    mostrarMensajeAuth("Introduce tu correo y contraseña.");
    return;
  }

  mostrarMensajeAuth("Iniciando sesión...", "success");

  try {
    usuarioActual = await Backendless.UserService.login(email, password, true);
    detectarPropietario(usuarioActual);
    actualizarAreaUsuario();

    const formulario = obtenerElemento("login-form");
    if (formulario) formulario.reset();

    mostrarMensajeAuth("Sesión iniciada correctamente.", "success");
    setTimeout(mostrarTienda, 450);
  } catch (error) {
    console.error("Error iniciando sesión:", error);
    mostrarMensajeAuth(obtenerMensajeError(error, "Correo o contraseña incorrectos."));
  }
}

async function cerrarSesion() {
  try {
    await cerrarSesionBackendless();
  } finally {
    usuarioActual = null;
    usuarioEsOwner = false;
    obtenerElemento("account-menu")?.remove();
    actualizarAreaUsuario();
    mostrarTienda();
  }
}

async function cargarSesionExistente() {
  usuarioActual = await obtenerUsuarioActual();
  detectarPropietario(usuarioActual);
  actualizarAreaUsuario();
}

function obtenerMensajeError(error, mensajeDefault) {
  const texto = String(error?.message || error?.description || error?.code || "");
  const min = texto.toLowerCase();

  if (min.includes("already") || min.includes("exists")) return "Ese correo ya está registrado.";
  if (min.includes("password")) return "La contraseña no es correcta.";
  if (min.includes("invalid")) return "Los datos introducidos no son válidos.";

  return texto || mensajeDefault;
}

document.addEventListener("DOMContentLoaded", async () => {
  obtenerElemento("login-form")?.addEventListener("submit", iniciarSesion);
  obtenerElemento("register-form")?.addEventListener("submit", registrarUsuario);
  await cargarSesionExistente();
});

window.mostrarLogin = mostrarLogin;
window.mostrarRegistro = mostrarRegistro;
window.mostrarTienda = mostrarTienda;
window.mostrarMenuCuenta = mostrarMenuCuenta;
window.irAlPanelAdmin = irAlPanelAdmin;
window.cerrarSesion = cerrarSesion;
window.escapeHTML = escapeHTML;
