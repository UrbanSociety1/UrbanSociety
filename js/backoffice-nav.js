/* =========================================================
   URBAN SOCIETY
   BACKOFFICE NAVIGATION
========================================================= */
(function () {
  if (window.__urbanBackofficeNavInstalled) return;
  window.__urbanBackofficeNavInstalled = true;

  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  const allowed = [
    'admin.html','pos.html','products.html','orders.html','cash.html',
    'reports.html','returns.html','inventory.html','customers.html','staff.html','settings.html'
  ];
  if (!allowed.includes(page)) return;

  const modules = [
    { group: 'General', href: 'admin.html', icon: '⌂', label: 'Inicio', key: 'dashboard', permission: 'dashboard' },
    { group: 'General', href: 'pos.html', icon: '🧾', label: 'Punto de venta', key: 'pos', permission: 'pos' },
    { group: 'Operación', href: 'products.html', icon: '👟', label: 'Productos', key: 'products', permission: 'products', badge: 'low-stock' },
    { group: 'Operación', href: 'orders.html', icon: '📦', label: 'Pedidos', key: 'orders', permission: 'orders' },
    { group: 'Operación', href: 'cash.html', icon: '💵', label: 'Caja y cortes', key: 'cash', permission: 'cash' },
    { group: 'Operación', href: 'returns.html', icon: '↩', label: 'Devoluciones', key: 'returns', permission: 'returns' },
    { group: 'Inventario', href: 'inventory.html', icon: '⇅', label: 'Movimientos', key: 'inventory', permission: 'inventory' },
    { group: 'Análisis', href: 'reports.html', icon: '📊', label: 'Reportes', key: 'reports', permission: 'reports' },
    { group: 'Clientes', href: 'customers.html', icon: '👥', label: 'Clientes', key: 'customers', permission: 'customers' },
    { group: 'Sistema', href: 'staff.html', icon: '🪪', label: 'Empleados', key: 'staff', ownerOnly: true },
    { group: 'Sistema', href: 'settings.html', icon: '⚙', label: 'Configuración', key: 'settings', permission: 'settings' }
  ];

  function canModule(module, access) {
    if (access?.owner) return true;
    if (module.ownerOnly) return false;
    return Boolean(access?.permissions?.[module.permission]);
  }

  function activeKey() {
    const map = {
      'admin.html': 'dashboard', 'pos.html': 'pos', 'products.html': 'products',
      'orders.html': 'orders', 'cash.html': 'cash', 'returns.html': 'returns',
      'inventory.html': 'inventory', 'reports.html': 'reports', 'customers.html': 'customers',
      'staff.html': 'staff', 'settings.html': 'settings'
    };
    return map[page] || 'dashboard';
  }

  function item(module) {
    const badge = module.badge ? `<span class="urban-bo-badge" data-bo-badge="${module.badge}" hidden></span>` : '';
    return `<a class="urban-bo-link" data-bo-key="${module.key}" href="${module.href}"><span class="urban-bo-icon">${module.icon}</span><span class="urban-bo-label">${module.label}</span>${badge}</a>`;
  }

  function navHtml(access) {
    let lastGroup = '';
    return modules.filter(m => canModule(m, access)).map(m => {
      const group = m.group !== lastGroup ? `<div class="urban-bo-nav-label">${m.group}</div>` : '';
      lastGroup = m.group;
      return group + item(m);
    }).join('');
  }

  function closeMenu() {
    document.getElementById('urban-bo-sidebar')?.classList.remove('open');
    document.getElementById('urban-bo-overlay')?.classList.remove('open');
  }

  async function logoutBackoffice() {
    try { await window.urbanSupabase?.auth?.signOut(); } catch (_) {}
    location.href = 'UrbanSociety.html';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const access = await (window.urbanAccessReady || Promise.resolve({ owner: true, permissions: {} }));
    document.body.classList.add('urban-backoffice-page');

    const overlay = document.createElement('div');
    overlay.id = 'urban-bo-overlay';
    overlay.className = 'urban-bo-overlay';

    const sidebar = document.createElement('aside');
    sidebar.id = 'urban-bo-sidebar';
    sidebar.className = 'urban-bo-sidebar';
    const identity = access?.owner
      ? 'Propietario'
      : `${access?.staff?.name || access?.user?.email || 'Empleado'} · ${access?.staff?.role || 'Equipo'}`;
    sidebar.innerHTML = `
      <div class="urban-bo-brand">
        <img src="images/Logo Urban.png" alt="Urban Society" onerror="this.style.display='none'">
        <div><strong>URBAN SOCIETY</strong><span>${identity}</span></div>
      </div>
      <nav class="urban-bo-nav" aria-label="Menú administrativo">${navHtml(access)}</nav>
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
    sidebar.querySelector(`[data-bo-key="${activeKey()}"]`)?.classList.add('active');

    mobileButton.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', closeMenu);
    sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.getElementById('urban-bo-logout')?.addEventListener('click', logoutBackoffice);
    document.dispatchEvent(new CustomEvent('urban:backoffice-ready', { detail: access }));
  });
})();
