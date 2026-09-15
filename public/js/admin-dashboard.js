/* =========================================================
   URBAN SOCIETY
   ADMIN DASHBOARD
   BACKENDLESS
========================================================= */

(function () {
  if (window.__urbanAdminDashboardInstalled) return;
  window.__urbanAdminDashboardInstalled = true;

  const currentPage =
    (location.pathname.split('/').pop() || '').toLowerCase();

  if (currentPage !== 'admin.html') return;

  const money = value =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(value || 0));

  const escapeHtml = value =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

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

  function startOfToday() {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  }

  function endOfToday() {
    const date = new Date();

    date.setHours(23, 59, 59, 999);

    return date;
  }

  function ensureDashboard() {
    let dashboard =
      document.getElementById('admin-dashboard');

    if (dashboard) return dashboard;

    const title =
      document.querySelector('.admin-title');

    const stats =
      document.querySelector('.stats');

    if (!title || !stats) return null;

    title
      .querySelector('h2')
      ?.replaceChildren(
        document.createTextNode('Inicio')
      );

    const subtitle =
      title.querySelector('p');

    if (subtitle) {
      subtitle.textContent =
        'Resumen operativo de Urban Society.';
    }

    dashboard =
      document.createElement('section');

    dashboard.id =
      'admin-dashboard';

    dashboard.className =
      'admin-dashboard';

    dashboard.innerHTML = `
      <div class="admin-dashboard-hero">
        <div>
          <span class="admin-dashboard-eyebrow">
            PANEL OPERATIVO
          </span>

          <h2>
            ${escapeHtml(greeting())}
          </h2>

          <p>
            Revisa ventas, caja, pedidos y existencias desde un solo lugar.
          </p>
        </div>

        <div class="admin-dashboard-date">
          ${escapeHtml(todayLabel())}
        </div>
      </div>

      <div
        id="admin-dashboard-metrics"
        class="admin-dashboard-metrics"
      >
        <div class="admin-dashboard-loading">
          Cargando resumen...
        </div>
      </div>

      <div class="admin-dashboard-main-grid">

        <div class="admin-dashboard-panel">
          <div class="admin-dashboard-panel-head">
            <h3>Actividad reciente</h3>

            <a
              href="pos.html"
              data-dash-permission="pos"
            >
              Ir al punto de venta →
            </a>
          </div>

          <div
            id="admin-dashboard-activity"
            class="admin-dashboard-activity"
          >
            <div class="admin-dashboard-loading">
              Cargando actividad...
            </div>
          </div>
        </div>

        <div class="admin-dashboard-panel">
          <div class="admin-dashboard-panel-head">
            <h3>Stock bajo</h3>

            <a
              href="products.html"
              data-dash-permission="products"
            >
              Administrar productos →
            </a>
          </div>

          <div
            id="admin-dashboard-low-stock"
            class="admin-dashboard-stock-list"
          >
            <div class="admin-dashboard-loading">
              Revisando inventario...
            </div>
          </div>
        </div>

      </div>

      <div class="admin-dashboard-panel">

        <div class="admin-dashboard-panel-head">
          <h3>Accesos rápidos</h3>

          <button
            id="admin-dashboard-refresh"
            type="button"
            class="secondary-button"
          >
            ↻ Actualizar
          </button>
        </div>

        <div class="admin-dashboard-actions">

          <a
            class="admin-dashboard-action"
            href="pos.html"
            data-dash-permission="pos"
          >
            <span>🧾</span>
            <span>
              <b>Nueva venta</b>
              <small>Punto de venta</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="products.html"
            data-dash-permission="products"
          >
            <span>👟</span>
            <span>
              <b>Productos</b>
              <small>Catálogo e inventario</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="orders.html"
            data-dash-permission="orders"
          >
            <span>📦</span>
            <span>
              <b>Pedidos</b>
              <small>Tienda online</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="cash.html"
            data-dash-permission="cash"
          >
            <span>💵</span>
            <span>
              <b>Caja y cortes</b>
              <small>Control de efectivo</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="returns.html"
            data-dash-permission="returns"
          >
            <span>↩</span>
            <span>
              <b>Devoluciones</b>
              <small>Cambios y reembolsos</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="inventory.html"
            data-dash-permission="inventory"
          >
            <span>⇅</span>
            <span>
              <b>Movimientos</b>
              <small>Historial de stock</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="reports.html"
            data-dash-permission="reports"
          >
            <span>📊</span>
            <span>
              <b>Reportes</b>
              <small>Ventas y rendimiento</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="customers.html"
            data-dash-permission="customers"
          >
            <span>👥</span>
            <span>
              <b>Clientes</b>
              <small>Compras y seguimiento</small>
            </span>
          </a>

          <a
            class="admin-dashboard-action"
            href="settings.html"
            data-dash-permission="settings"
          >
            <span>⚙️</span>
            <span>
              <b>Configuración</b>
              <small>Datos del negocio</small>
            </span>
          </a>

        </div>
      </div>
    `;

    stats.before(dashboard);

    document.body.classList.add(
      'admin-dashboard-ready'
    );

    return dashboard;
  }

  function applyActionPermissions() {
    document
      .querySelectorAll('[data-dash-permission]')
      .forEach(element => {

        const permission =
          element.dataset.dashPermission;

        if (
          typeof window.urbanCan === 'function' &&
          !window.urbanCan(permission)
        ) {
          element.remove();
        }
      });
  }

  function metric(
    icon,
    label,
    value,
    detail,
    extraClass = ''
  ) {
    return `
      <article
        class="admin-dashboard-metric ${extraClass}"
      >
        <span class="metric-icon">
          ${icon}
        </span>

        <span class="metric-label">
          ${escapeHtml(label)}
        </span>

        <strong>
          ${escapeHtml(value)}
        </strong>

        <small>
          ${escapeHtml(detail)}
        </small>
      </article>
    `;
  }

  function renderMetrics(data) {
    const container =
      document.getElementById(
        'admin-dashboard-metrics'
      );

    if (!container) return;

    const cashOpen =
      Boolean(data.cash?.open);

    const pendingClass =
      Number(data.pendingOrders || 0) > 0
        ? 'is-alert'
        : 'is-good';

    const stockClass =
      Number(data.lowStock?.length || 0) > 0
        ? 'is-alert'
        : 'is-good';

    container.innerHTML = [

      metric(
        '🧾',
        'Ventas físicas hoy',
        money(data.posTodayTotal),
        `${data.posTodayCount} venta${
          data.posTodayCount === 1
            ? ''
            : 's'
        } en mostrador`,
        data.posTodayCount
          ? 'is-good'
          : ''
      ),

      metric(
        '🛒',
        'Pedidos online hoy',
        money(data.onlineTodayTotal),
        `${data.onlineTodayCount} pedido${
          data.onlineTodayCount === 1
            ? ''
            : 's'
        }`
      ),

      metric(
        cashOpen ? '🟢' : '🔒',
        'Caja',
        cashOpen
          ? money(data.cash.expectedCash)
          : 'Cerrada',
        cashOpen
          ? `Caja abierta · ${data.cash.salesCount || 0} venta${
              Number(data.cash.salesCount || 0) === 1
                ? ''
                : 's'
            }`
          : 'Abre caja antes de cobrar',
        cashOpen
          ? 'is-good is-cash-open'
          : ''
      ),

      metric(
        '📦',
        'Pedidos pendientes',
        String(data.pendingOrders || 0),
        data.pendingOrders
          ? 'Requieren seguimiento'
          : 'No tienes pedidos pendientes',
        pendingClass
      ),

      metric(
        '⚠️',
        'Stock bajo',
        String(data.lowStock?.length || 0),
        `Umbral: ${data.lowStockThreshold} pieza${
          data.lowStockThreshold === 1
            ? ''
            : 's'
        }`,
        stockClass
      ),

      metric(
        '👟',
        'Productos activos',
        String(data.activeProducts || 0),
        `${data.totalProducts || 0} producto${
          data.totalProducts === 1
            ? ''
            : 's'
        } en total`
      )

    ].join('');
  }

  function renderLowStock(products) {
    const container =
      document.getElementById(
        'admin-dashboard-low-stock'
      );

    if (!container) return;

    if (!products.length) {
      container.innerHTML =
        '<div class="admin-dashboard-empty">✓ No hay productos con stock bajo.</div>';

      return;
    }

    container.innerHTML =
      products
        .slice(0, 6)
        .map(product => `
          <div class="admin-dashboard-stock-row">

            <img
              src="${escapeHtml(
                product.image ||
                'images/Logo Urban.png'
              )}"
              alt="${escapeHtml(
                product.name ||
                'Producto'
              )}"
              onerror="this.src='images/Logo Urban.png'"
            >

            <div>
              <strong>
                ${escapeHtml(
                  product.name ||
                  'Producto'
                )}
              </strong>

              <small>
                ${escapeHtml(
                  product.category ||
                  'General'
                )}
              </small>
            </div>

            <span class="admin-dashboard-stock-count">
              ${Number(product.stock || 0)}
            </span>

          </div>
        `)
        .join('');
  }

  function renderActivity(activity) {
    const container =
      document.getElementById(
        'admin-dashboard-activity'
      );

    if (!container) return;

    const rows =
      Array.isArray(activity)
        ? activity
        : [];

    if (!rows.length) {
      container.innerHTML =
        '<div class="admin-dashboard-empty">Todavía no hay actividad registrada.</div>';

      return;
    }

    container.innerHTML =
      rows
        .map(item => `
          <div class="admin-dashboard-activity-row">

            <span class="admin-dashboard-activity-icon">
              ${escapeHtml(item.icon || '•')}
            </span>

            <div>
              <strong>
                ${escapeHtml(
                  item.title ||
                  'Actividad'
                )}
              </strong>

              <small>
                ${escapeHtml(
                  item.subtitle ||
                  ''
                )}
                ·
                ${escapeHtml(
                  formatDate(item.date)
                )}
              </small>
            </div>

            <strong class="admin-dashboard-activity-amount">
              ${money(item.amount)}
            </strong>

          </div>
        `)
        .join('');
  }

  async function getTableData(
    tableName,
    pageSize = 100
  ) {
    try {
      const query =
        Backendless.DataQueryBuilder
          .create()
          .setPageSize(pageSize);

      const result =
        await Backendless.Data
          .of(tableName)
          .find(query);

      return Array.isArray(result)
        ? result
        : [];

    } catch (error) {
      console.warn(
        `No se pudo consultar ${tableName}:`,
        error
      );

      return [];
    }
  }

  async function loadDashboard() {

    const refresh =
      document.getElementById(
        'admin-dashboard-refresh'
      );

    if (refresh) {
      refresh.disabled = true;
      refresh.textContent =
        'Actualizando...';
    }

    try {

      if (
        typeof iniciarBackendless !==
        'function' ||
        !iniciarBackendless()
      ) {
        throw new Error(
          'Backendless no está disponible.'
        );
      }

      const start =
        startOfToday();

      const end =
        endOfToday();

      const [
        products,
        orders,
        posSales
      ] = await Promise.all([
        getTableData(
          'products',
          200
        ),
        getTableData(
          'orders',
          200
        ),
        getTableData(
          'pos_sales',
          200
        )
      ]);

      const todayOrders =
        orders.filter(order => {

          const date =
            new Date(
              order.created_at ||
              order.createdAt ||
              order.created
            );

          return (
            !Number.isNaN(date.getTime()) &&
            date >= start &&
            date <= end
          );
        });

      const todayPosSales =
        posSales.filter(sale => {

          const date =
            new Date(
              sale.created_at ||
              sale.createdAt ||
              sale.created
            );

          return (
            !Number.isNaN(date.getTime()) &&
            date >= start &&
            date <= end
          );
        });

      const validOnlineOrders =
        todayOrders.filter(
          order =>
            String(
              order.status || ''
            ).toLowerCase() !==
            'cancelado'
        );

      const onlineTodayTotal =
        validOnlineOrders.reduce(
          (sum, order) =>
            sum +
            Number(
              order.total || 0
            ),
          0
        );

      const posTodayTotal =
        todayPosSales.reduce(
          (sum, sale) =>
            sum +
            Number(
              sale.total ||
              sale.amount ||
              sale.total_amount ||
              0
            ),
          0
        );

      const pendingOrders =
        orders.filter(order => {

          const status =
            String(
              order.status || ''
            ).toLowerCase();

          return ![
            'entregado',
            'cancelado',
            'completado',
            'completed'
          ].includes(status);
        }).length;

      const activeProducts =
        products.filter(
          product =>
            product.active !== false &&
            product.active !== 0
        ).length;

      const totalProducts =
        products.length;

      const lowStockThreshold = 5;

      const lowStock =
        products.filter(product => {

          const stock =
            Number(
              product.stock || 0
            );

          return (
            product.active !== false &&
            stock <= lowStockThreshold
          );
        });

      const recentOrders =
        orders
          .slice()
          .sort(
            (a, b) =>
              new Date(
                b.created_at ||
                b.createdAt ||
                0
              ) -
              new Date(
                a.created_at ||
                a.createdAt ||
                0
              )
          )
          .slice(0, 8);

      const recentSales =
        posSales
          .slice()
          .sort(
            (a, b) =>
              new Date(
                b.created_at ||
                b.createdAt ||
                0
              ) -
              new Date(
                a.created_at ||
                a.createdAt ||
                0
              )
          )
          .slice(0, 8);

      const activity = [];

      recentOrders.forEach(order => {
        activity.push({
          icon: '📦',
          title: 'Pedido online',
          subtitle:
            '#' +
            (
              order.id ||
              order.objectId ||
              'Sin número'
            ),
          date:
            order.created_at ||
            order.createdAt,
          amount:
            Number(order.total || 0)
        });
      });

      recentSales.forEach(sale => {
        activity.push({
          icon: '🧾',
          title: 'Venta en mostrador',
          subtitle:
            '#' +
            (
              sale.id ||
              sale.objectId ||
              'Sin número'
            ),
          date:
            sale.created_at ||
            sale.createdAt,
          amount:
            Number(
              sale.total ||
              sale.amount ||
              sale.total_amount ||
              0
            )
        });
      });

      activity.sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

      const summary = {
        posTodayTotal,
        posTodayCount:
          todayPosSales.length,

        onlineTodayTotal,
        onlineTodayCount:
          validOnlineOrders.length,

        pendingOrders,

        lowStock,

        lowStockThreshold,

        activeProducts,

        totalProducts,

        cash: {
          open: false,
          expectedCash: 0,
          folio: '',
          salesCount:
            todayPosSales.length
        },

        recentActivity:
          activity.slice(0, 10)
      };

      renderMetrics(summary);
      renderLowStock(lowStock);
      renderActivity(
        summary.recentActivity
      );

    } catch (error) {

      console.error(
        'Error cargando dashboard:',
        error
      );

      const metrics =
        document.getElementById(
          'admin-dashboard-metrics'
        );

      const activity =
        document.getElementById(
          'admin-dashboard-activity'
        );

      const stock =
        document.getElementById(
          'admin-dashboard-low-stock'
        );

      if (metrics) {
        metrics.innerHTML =
          '<div class="admin-dashboard-empty">No se pudo cargar el resumen. Pulsa Actualizar.</div>';
      }

      if (activity) {
        activity.innerHTML =
          '<div class="admin-dashboard-empty">No se pudo cargar la actividad.</div>';
      }

      if (stock) {
        stock.innerHTML =
          '<div class="admin-dashboard-empty">No se pudo revisar el inventario.</div>';
      }

    } finally {

      if (refresh) {
        refresh.disabled = false;
        refresh.textContent =
          '↻ Actualizar';
      }
    }
  }

  document.addEventListener(
    'DOMContentLoaded',
    async () => {

      const dashboard =
        ensureDashboard();

      if (!dashboard) return;

      if (
        await window.verificarAcceso?.(
          'dashboard'
        ) === false
      ) {
        return;
      }

      applyActionPermissions();

      document
        .getElementById(
          'admin-dashboard-refresh'
        )
        ?.addEventListener(
          'click',
          loadDashboard
        );

      await loadDashboard();
    }
  );

  window.loadAdminDashboard =
    loadDashboard;

})();
