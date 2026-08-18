/* =========================================================
   URBAN SOCIETY
   ADMIN DASHBOARD
========================================================= */
(function () {
  if (window.__urbanAdminDashboardInstalled) return;
  window.__urbanAdminDashboardInstalled = true;

  const currentPage = (location.pathname.split('/').pop() || '').toLowerCase();
  if (currentPage !== 'admin.html') return;

  function money(value) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(value || 0));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  function todayLabel() {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date());
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  function localDayStartIso() {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    ).toISOString();
  }

  function ensureDashboard() {
    let dashboard = document.getElementById('admin-dashboard');
    if (dashboard) return dashboard;

    const title = document.querySelector('.admin-title');
    const stats = document.querySelector('.stats');
    if (!title || !stats) return null;

    title.querySelector('h2')?.replaceChildren(document.createTextNode('Inicio'));
    const subtitle = title.querySelector('p');
    if (subtitle) subtitle.textContent = 'Resumen operativo de Urban Society.';

    dashboard = document.createElement('section');
    dashboard.id = 'admin-dashboard';
    dashboard.className = 'admin-dashboard';
    dashboard.innerHTML = `
      <div class="admin-dashboard-hero">
        <div>
          <span class="admin-dashboard-eyebrow">PANEL DEL PROPIETARIO</span>
          <h2>${escapeHtml(greeting())}</h2>
          <p>Revisa ventas, caja, pedidos y existencias desde un solo lugar.</p>
        </div>
        <div class="admin-dashboard-date">${escapeHtml(todayLabel())}</div>
      </div>

      <div id="admin-dashboard-metrics" class="admin-dashboard-metrics">
        <div class="admin-dashboard-loading">Cargando resumen...</div>
      </div>

      <div class="admin-dashboard-main-grid">
        <div class="admin-dashboard-panel">
          <div class="admin-dashboard-panel-head">
            <h3>Actividad reciente</h3>
            <a href="pos.html">Ir al punto de venta →</a>
          </div>
          <div id="admin-dashboard-activity" class="admin-dashboard-activity">
            <div class="admin-dashboard-loading">Cargando actividad...</div>
          </div>
        </div>

        <div class="admin-dashboard-panel">
          <div class="admin-dashboard-panel-head">
            <h3>Stock bajo</h3>
            <a href="admin.html#product-form">Administrar productos →</a>
          </div>
          <div id="admin-dashboard-low-stock" class="admin-dashboard-stock-list">
            <div class="admin-dashboard-loading">Revisando inventario...</div>
          </div>
        </div>
      </div>

      <div class="admin-dashboard-panel">
        <div class="admin-dashboard-panel-head">
          <h3>Accesos rápidos</h3>
          <button id="admin-dashboard-refresh" type="button" class="secondary-button">↻ Actualizar</button>
        </div>
        <div class="admin-dashboard-actions">
          <a class="admin-dashboard-action" href="pos.html">
            <span>🧾</span><span><b>Nueva venta</b><small>Punto de venta</small></span>
          </a>
          <a class="admin-dashboard-action" href="admin.html#product-form">
            <span>👟</span><span><b>Agregar producto</b><small>Inventario</small></span>
          </a>
          <a class="admin-dashboard-action" href="admin.html#admin-orders">
            <span>📦</span><span><b>Ver pedidos</b><small>Tienda online</small></span>
          </a>
          <a class="admin-dashboard-action" href="pos.html#pos-cash-section">
            <span>💵</span><span><b>Caja y cortes</b><small>Control de efectivo</small></span>
          </a>
          <a class="admin-dashboard-action" href="settings.html">
            <span>⚙️</span><span><b>Configuración</b><small>Datos del negocio</small></span>
          </a>
        </div>
      </div>
    `;

    stats.before(dashboard);
    document.body.classList.add('admin-dashboard-ready');
    return dashboard;
  }

  function metric(icon, label, value, detail, extraClass = '') {
    return `
      <article class="admin-dashboard-metric ${extraClass}">
        <span class="metric-icon">${icon}</span>
        <span class="metric-label">${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(detail)}</small>
      </article>
    `;
  }

  function renderMetrics(data) {
    const container = document.getElementById('admin-dashboard-metrics');
    if (!container) return;

    const cashOpen = Boolean(data.cash?.open);
    const pendingAlert = Number(data.pendingOrders || 0) > 0 ? 'is-alert' : 'is-good';
    const stockAlert = Number(data.lowStock?.length || 0) > 0 ? 'is-alert' : 'is-good';

    container.innerHTML = [
      metric(
        '🧾',
        'Ventas físicas hoy',
        money(data.posTodayTotal),
        `${data.posTodayCount} venta${data.posTodayCount === 1 ? '' : 's'} en mostrador`,
        data.posTodayCount > 0 ? 'is-good' : ''
      ),
      metric(
        '🛒',
        'Pedidos online hoy',
        money(data.onlineTodayTotal),
        `${data.onlineTodayCount} pedido${data.onlineTodayCount === 1 ? '' : 's'} no cancelado${data.onlineTodayCount === 1 ? '' : 's'}`
      ),
      metric(
        cashOpen ? '🟢' : '🔒',
        'Caja',
        cashOpen ? money(data.cash.expectedCash) : 'Cerrada',
        cashOpen
          ? `Apertura #${data.cash.folio || ''} · ${data.cash.salesCount || 0} venta${Number(data.cash.salesCount || 0) === 1 ? '' : 's'}`
          : 'Abre caja antes de cobrar en tienda física',
        cashOpen ? 'is-good is-cash-open' : ''
      ),
      metric(
        '📦',
        'Pedidos pendientes',
        String(data.pendingOrders || 0),
        data.pendingOrders ? 'Requieren revisión o seguimiento' : 'No tienes pedidos pendientes',
        pendingAlert
      ),
      metric(
        '⚠️',
        'Stock bajo',
        String(data.lowStock?.length || 0),
        `Umbral configurado: ${data.lowStockThreshold} pieza${data.lowStockThreshold === 1 ? '' : 's'}`,
        stockAlert
      ),
      metric(
        '👟',
        'Productos activos',
        String(data.activeProducts || 0),
        `${data.totalProducts || 0} producto${data.totalProducts === 1 ? '' : 's'} en total`
      )
    ].join('');
  }

  function renderLowStock(products) {
    const container = document.getElementById('admin-dashboard-low-stock');
    if (!container) return;

    if (!products.length) {
      container.innerHTML = `
        <div class="admin-dashboard-empty">
          ✓ No hay productos con stock bajo.
        </div>
      `;
      return;
    }

    container.innerHTML = products.slice(0, 6).map(product => `
      <div class="admin-dashboard-stock-row">
        <img
          src="${escapeHtml(product.image || 'images/Logo Urban.png')}"
          alt="${escapeHtml(product.name || 'Producto')}"
          onerror="this.src='images/Logo Urban.png'"
        >
        <div>
          <strong>${escapeHtml(product.name || 'Producto')}</strong>
          <small>${escapeHtml(product.category || 'General')}${product.active === false ? ' · Inactivo' : ''}</small>
        </div>
        <span class="admin-dashboard-stock-count">${Number(product.stock || 0)}</span>
      </div>
    `).join('');
  }

  function renderActivity(posSales, orders) {
    const container = document.getElementById('admin-dashboard-activity');
    if (!container) return;

    const activity = [
      ...(posSales || []).map(sale => ({
        type: 'pos',
        date: sale.created_at,
        title: `Venta física #${sale.folio}`,
        subtitle: `${sale.customer_name || 'Venta mostrador'} · ${sale.payment_method || ''}`,
        amount: Number(sale.total || 0),
        icon: '🧾'
      })),
      ...(orders || []).map(order => ({
        type: 'order',
        date: order.created_at,
        title: 'Pedido online',
        subtitle: `${order.customer_name || 'Cliente'} · ${order.status || 'Pendiente'}`,
        amount: Number(order.total || 0),
        icon: '📦'
      }))
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    if (!activity.length) {
      container.innerHTML = `
        <div class="admin-dashboard-empty">
          Todavía no hay actividad registrada.
        </div>
      `;
      return;
    }

    container.innerHTML = activity.map(item => `
      <div class="admin-dashboard-activity-row">
        <span class="admin-dashboard-activity-icon">${item.icon}</span>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.subtitle)} · ${escapeHtml(formatDate(item.date))}</small>
        </div>
        <strong class="admin-dashboard-activity-amount">${money(item.amount)}</strong>
      </div>
    `).join('');
  }

  async function loadDashboard() {
    if (!window.urbanSupabase) return;

    const refresh = document.getElementById('admin-dashboard-refresh');
    if (refresh) {
      refresh.disabled = true;
      refresh.textContent = 'Actualizando...';
    }

    try {
      const startToday = localDayStartIso();

      const [
        productsRes,
        settingsRes,
        pendingRes,
        posTodayRes,
        onlineTodayRes,
        recentPosRes,
        recentOrdersRes,
        cashRes
      ] = await Promise.all([
        window.urbanSupabase
          .from('products')
          .select('id,name,category,image,stock,active,created_at')
          .order('created_at', { ascending: false }),
        window.urbanSupabase
          .from('store_settings')
          .select('low_stock_threshold')
          .eq('id', 'main')
          .maybeSingle(),
        window.urbanSupabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pendiente'),
        window.urbanSupabase
          .from('pos_sales')
          .select('id,total,created_at')
          .gte('created_at', startToday),
        window.urbanSupabase
          .from('orders')
          .select('id,total,status,created_at')
          .gte('created_at', startToday)
          .neq('status', 'Cancelado'),
        window.urbanSupabase
          .from('pos_sales')
          .select('id,folio,created_at,customer_name,payment_method,total')
          .order('created_at', { ascending: false })
          .limit(6),
        window.urbanSupabase
          .from('orders')
          .select('id,created_at,customer_name,total,status')
          .order('created_at', { ascending: false })
          .limit(6),
        window.urbanSupabase.rpc('get_pos_cash_summary')
      ]);

      const allResponses = [productsRes, pendingRes, posTodayRes, onlineTodayRes, recentPosRes, recentOrdersRes, cashRes];
      const firstError = allResponses.find(result => result?.error)?.error;
      if (firstError) throw firstError;

      const products = productsRes.data || [];
      const lowStockThreshold = Math.max(
        0,
        Number(settingsRes.data?.low_stock_threshold ?? 5)
      );
      const lowStock = products
        .filter(product => product.active !== false && Number(product.stock || 0) <= lowStockThreshold)
        .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

      const posToday = posTodayRes.data || [];
      const onlineToday = onlineTodayRes.data || [];

      const data = {
        posTodayCount: posToday.length,
        posTodayTotal: posToday.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        onlineTodayCount: onlineToday.length,
        onlineTodayTotal: onlineToday.reduce((sum, order) => sum + Number(order.total || 0), 0),
        pendingOrders: Number(pendingRes.count || 0),
        cash: cashRes.data || { open: false },
        lowStockThreshold,
        lowStock,
        activeProducts: products.filter(product => product.active !== false).length,
        totalProducts: products.length
      };

      renderMetrics(data);
      renderLowStock(lowStock);
      renderActivity(recentPosRes.data || [], recentOrdersRes.data || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      const metrics = document.getElementById('admin-dashboard-metrics');
      const activity = document.getElementById('admin-dashboard-activity');
      const stock = document.getElementById('admin-dashboard-low-stock');

      if (metrics) metrics.innerHTML = '<div class="admin-dashboard-empty">No se pudo cargar el resumen. Pulsa Actualizar.</div>';
      if (activity) activity.innerHTML = '<div class="admin-dashboard-empty">No se pudo cargar la actividad.</div>';
      if (stock) stock.innerHTML = '<div class="admin-dashboard-empty">No se pudo revisar el inventario.</div>';
    } finally {
      if (refresh) {
        refresh.disabled = false;
        refresh.textContent = '↻ Actualizar';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const dashboard = ensureDashboard();
    if (!dashboard) return;

    const allowed = typeof window.verificarOwner === 'function'
      ? await window.verificarOwner()
      : true;
    if (!allowed) return;

    document.getElementById('admin-dashboard-refresh')?.addEventListener('click', loadDashboard);
    await loadDashboard();
  });

  window.loadAdminDashboard = loadDashboard;
})();
