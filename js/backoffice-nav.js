/* =========================================================
   URBAN SOCIETY
   BACKOFFICE NAVIGATION
========================================================= */
(function () {
  if (window.__urbanBackofficeNavInstalled) return;
  window.__urbanBackofficeNavInstalled = true;

  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  const allowed = ['admin.html', 'pos.html', 'settings.html'];
  if (!allowed.includes(page)) return;

  function item(href, icon, label, key) {
    return `<a class="urban-bo-link" data-bo-key="${key}" href="${href}"><span class="urban-bo-icon">${icon}</span><span>${label}</span></a>`;
  }

  function activeKey() {
    const hash = location.hash;
    if (page === 'settings.html') return 'settings';
    if (page === 'pos.html' && hash === '#pos-cash-section') return 'cash';
    if (page === 'pos.html') return 'pos';
    if (page === 'admin.html' && hash === '#product-form') return 'products';
    if (page === 'admin.html' && hash === '#admin-orders') return 'orders';
    return 'home';
  }

  function setActive() {
    const current = activeKey();
    document.querySelectorAll('.urban-bo-link[data-bo-key]').forEach(link => {
      link.classList.toggle('active', link.dataset.boKey === current);
    });
  }

  function closeMenu() {
    document.getElementById('urban-bo-sidebar')?.classList.remove('open');
    document.getElementById('urban-bo-overlay')?.classList.remove('open');
  }

  function scrollToHashTarget() {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const target = document.getElementById(id);
      if (target) {
        clearInterval(timer);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (tries >= 20) {
        clearInterval(timer);
      }
    }, 120);
  }

  async function logoutBackoffice() {
    try {
      if (window.Backendless?.UserService?.logout) {
        await window.Backendless.UserService.logout();
      } else if (window.urbanSupabase) {
        await window.urbanSupabase.auth.signOut();
      }
    } catch (error) {
      console.warn('No se pudo cerrar sesión limpiamente:', error);
    }
    location.href = 'UrbanSociety.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('urban-backoffice-page');

    const overlay = document.createElement('div');
    overlay.id = 'urban-bo-overlay';
    overlay.className = 'urban-bo-overlay';

    const sidebar = document.createElement('aside');
    sidebar.id = 'urban-bo-sidebar';
    sidebar.className = 'urban-bo-sidebar';
    sidebar.innerHTML = `
      <div class="urban-bo-brand">
        <img src="images/Logo Urban.png" alt="Urban Society" onerror="this.style.display='none'">
        <div><strong>URBAN SOCIETY</strong><span>Panel administrativo</span></div>
      </div>

      <nav class="urban-bo-nav" aria-label="Menú administrativo">
        <div class="urban-bo-nav-label">General</div>
        ${item('admin.html', '⌂', 'Inicio', 'home')}
        ${item('pos.html', '🧾', 'Punto de venta', 'pos')}

        <div class="urban-bo-nav-label">Operación</div>
        ${item('admin.html#product-form', '👟', 'Productos', 'products')}
        ${item('admin.html#admin-orders', '📦', 'Pedidos', 'orders')}
        ${item('pos.html#pos-cash-section', '💵', 'Caja y cortes', 'cash')}

        <div class="urban-bo-nav-label">Sistema</div>
        ${item('settings.html', '⚙', 'Configuración', 'settings')}
      </nav>

      <div class="urban-bo-spacer"></div>
      <div class="urban-bo-footer">
        <a class="urban-bo-link urban-bo-store" href="UrbanSociety.html"><span class="urban-bo-icon">↗</span><span>Ver tienda online</span></a>
        <button id="urban-bo-logout" class="urban-bo-link urban-bo-logout" type="button"><span class="urban-bo-icon">⇥</span><span>Cerrar sesión</span></button>
      </div>
    `;

    const mobileButton = document.createElement('button');
    mobileButton.type = 'button';
    mobileButton.className = 'urban-bo-mobile-button';
    mobileButton.setAttribute('aria-label', 'Abrir menú administrativo');
    mobileButton.textContent = '☰';

    document.body.append(overlay, sidebar, mobileButton);

    mobileButton.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', closeMenu);
    sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.getElementById('urban-bo-logout')?.addEventListener('click', logoutBackoffice);

    window.addEventListener('hashchange', () => {
      setActive();
      scrollToHashTarget();
    });

    setActive();
    setTimeout(scrollToHashTarget, 150);
  });
})();
