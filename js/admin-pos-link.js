/* Urban Society: acceso directo al Punto de Venta desde administración */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".admin-header");
  if (!header || document.getElementById("urban-pos-link")) return;

  const link = document.createElement("a");
  link.id = "urban-pos-link";
  link.href = "pos.html";
  link.className = "back-button";
  link.textContent = "🧾 Punto de venta";

  const storeLink = header.querySelector('a[href="UrbanSociety.html"]');
  if (storeLink) header.insertBefore(link, storeLink);
  else header.appendChild(link);
});
