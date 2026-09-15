/* =========================================================
   URBAN SOCIETY
   CUSTOMER ACCOUNT DASHBOARD
   BACKENDLESS
========================================================= */

(function () {
  if (window.__urbanCustomerAccountInstalled) return;
  window.__urbanCustomerAccountInstalled = true;

  let accountUser = null;
  let accountOrders = [];

  const $ = id => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return 'Fecha no disponible';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  function statusClass(value) {
    return String(value || 'Pendiente')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');
  }

  function displayName() {
    return String(
      accountUser?.name ||
      accountUser?.full_name ||
      accountUser?.email?.split('@')[0] ||
      'Usuario'
    ).trim();
  }

  function toast(message) {
    const element = $('account-toast');

    if (!element) return;

    element.textContent = message;
    element.classList.add('show');

    clearTimeout(toast.timer);

    toast.timer = setTimeout(
      () => element.classList.remove('show'),
      2400
    );
  }

  function renderIdentity() {
    const name = displayName();
    const email = accountUser?.email || '';
    const initial = name.charAt(0).toUpperCase() || 'U';

    if ($('account-avatar')) {
      $('account-avatar').textContent = initial;
    }

    if ($('account-side-name')) {
      $('account-side-name').textContent = name;
    }

    if ($('account-side-email')) {
      $('account-side-email').textContent = email;
    }

    if ($('account-greeting')) {
      $('account-greeting').textContent = `Hola, ${name}`;
    }

    if ($('account-profile-name')) {
      $('account-profile-name').value = name;
    }

    if ($('account-profile-email')) {
      $('account-profile-email').value = email;
    }
  }

  function productList(order) {
    const products =
      Array.isArray(order.products)
        ? order.products
        : [];

    if (!products.length) {
      return '<li><span>Sin detalle de productos</span></li>';
    }

    return products.map(product => {
      const quantity = Number(product.quantity || 0);
      const price = Number(product.price || 0);
      const subtotal =
        Number(product.subtotal || (price * quantity));

      const size =
        String(product.size || '').trim();

      return `
        <li>
          <span>
            ${quantity} × ${escapeHtml(product.name || 'Producto')}
            ${size
              ? `<small>Talla ${escapeHtml(size)}</small>`
              : ''}
          </span>
          <strong>${money(subtotal)}</strong>
        </li>
      `;
    }).join('');
  }

  function orderCard(order) {
    const id =
      escapeHtml(
        order.id ||
        order.objectId ||
        'Sin número'
      );

    const status =
      escapeHtml(
        order.status ||
        'Pendiente'
      );

    const cls =
      statusClass(order.status);

    return `
      <article class="account-order-card">
        <div class="account-order-top">
          <div>
            <small>Pedido</small>
            <strong>#${id}</strong>
          </div>

          <span class="account-order-status status-${cls}">
            ${status}
          </span>
        </div>

        <ul class="account-order-products">
          ${productList(order)}
        </ul>

        <div class="account-order-footer">
          <div>
            <div>
              ${escapeHtml(
                formatDate(
                  order.created_at ||
                  order.createdAt
                )
              )}
            </div>

            <div style="margin-top:4px">
              Pago:
              ${escapeHtml(
                order.payment_method ||
                order.paymentMethod ||
                'Por acordar'
              )}
            </div>

            ${
              order.address
                ? `
                  <div style="margin-top:4px">
                    ${escapeHtml(order.address)}
                  </div>
                `
                : ''
            }
          </div>

          <div class="account-order-total">
            <span>Total</span>
            <strong>${money(order.total)}</strong>
          </div>
        </div>
      </article>
    `;
  }

  function renderOrders() {
    const list =
      $('account-orders-list');

    if (!list) return;

    if (!accountOrders.length) {
      list.innerHTML = `
        <div class="account-empty">
          <h3>Aún no tienes pedidos</h3>
          <p>
            Cuando compres con esta cuenta iniciada,
            tus pedidos aparecerán aquí.
          </p>
        </div>
      `;

      return;
    }

    list.innerHTML =
      accountOrders.map(orderCard).join('');
  }

  function renderLatestOrder() {
    const container =
      $('account-latest-order');

    if (!container) return;

    const order =
      accountOrders[0];

    if (!order) {
      container.innerHTML = `
        <div class="account-empty">
          <h3>Sin compras todavía</h3>
          <p>
            Tu pedido más reciente aparecerá aquí.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="account-latest-mini">
        <div class="account-latest-row">
          <span>Pedido</span>
          <strong>
            #${escapeHtml(
              order.id ||
              order.objectId ||
              'Sin número'
            )}
          </strong>
        </div>

        <div class="account-latest-row">
          <span>Fecha</span>
          <strong>
            ${escapeHtml(
              formatDate(
                order.created_at ||
                order.createdAt
              )
            )}
          </strong>
        </div>

        <div class="account-latest-row">
          <span>Estado</span>
          <span class="account-order-status status-${statusClass(order.status)}">
            ${escapeHtml(order.status || 'Pendiente')}
          </span>
        </div>

        <div class="account-latest-row">
          <span>Total</span>
          <strong>${money(order.total)}</strong>
        </div>
      </div>
    `;
  }

  function renderMetrics() {
    const validOrders =
      accountOrders.filter(
        order =>
          order.status !== 'Cancelado'
      );

    const activeOrders =
      accountOrders.filter(
        order =>
          ![
            'Entregado',
            'Cancelado'
          ].includes(order.status)
      );

    const spent =
      validOrders.reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    if ($('account-orders-count')) {
      $('account-orders-count').textContent =
        String(accountOrders.length);
    }

    if ($('account-spent-total')) {
      $('account-spent-total').textContent =
        money(spent);
    }

    if ($('account-active-orders')) {
      $('account-active-orders').textContent =
        String(activeOrders.length);
    }
  }

  async function loadOrders(showToast = false) {
    if (!accountUser) return;

    const list =
      $('account-orders-list');

    if (list) {
      list.innerHTML =
        '<div class="account-loading">Cargando pedidos...</div>';
    }

    try {
      const query =
        Backendless.DataQueryBuilder
          .create()
          .setWhereClause(
            "user_id = '" +
            String(accountUser.objectId)
              .replace(/'/g, "''") +
            "'"
          )
          .setSortBy(
            "created_at DESC"
          )
          .setPageSize(100);

      const data =
        await Backendless.Data
          .of("orders")
          .find(query);

      accountOrders =
        Array.isArray(data)
          ? data
          : [];

      renderOrders();
      renderLatestOrder();
      renderMetrics();

      if (showToast) {
        toast('Pedidos actualizados.');
      }

    } catch (error) {
      console.error(
        'Error cargando cuenta:',
        error
      );

      if (list) {
        list.innerHTML = `
          <div class="account-error">
            <h3>
              No pudimos cargar tus pedidos
            </h3>

            <p>
              ${escapeHtml(
                error?.message ||
                'Intenta nuevamente.'
              )}
            </p>
          </div>
        `;
      }

      const latest =
        $('account-latest-order');

      if (latest) {
        latest.innerHTML =
          '<div class="account-error">No se pudo cargar tu pedido reciente.</div>';
      }
    }
  }

  function showSection(sectionName) {
    const valid = [
      'overview',
      'orders',
      'profile'
    ];

    const target =
      valid.includes(sectionName)
        ? sectionName
        : 'overview';

    document
      .querySelectorAll('.account-section')
      .forEach(section => {
        section.classList.toggle(
          'account-section-active',
          section.id === target
        );
      });

    document
      .querySelectorAll('.account-nav-link')
      .forEach(link => {
        link.classList.toggle(
          'active',
          link.dataset.accountSection === target
        );
      });

    if (
      location.hash !== `#${target}`
    ) {
      history.replaceState(
        null,
        '',
        `#${target}`
      );
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function saveProfile(event) {
    event.preventDefault();

    const button =
      $('account-profile-save');

    const status =
      $('account-profile-status');

    const name =
      String(
        $('account-profile-name')?.value ||
        ''
      ).trim();

    if (name.length < 2) {
      if (status) {
        status.textContent =
          'Escribe un nombre válido.';
      }

      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent =
        'GUARDANDO...';
    }

    if (status) {
      status.textContent = '';
    }

    try {
      accountUser.name = name;

      const updatedUser =
        await Backendless.UserService.update(
          accountUser
        );

      accountUser =
        updatedUser ||
        accountUser;

      renderIdentity();

      if (status) {
        status.textContent =
          'Perfil actualizado.';
      }

      toast('Perfil actualizado.');

    } catch (error) {
      console.error(
        'Error actualizando perfil:',
        error
      );

      if (status) {
        status.textContent =
          error?.message ||
          'No se pudo actualizar el perfil.';
      }

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent =
          'GUARDAR CAMBIOS';
      }
    }
  }

  async function logout() {
    try {
      await Backendless.UserService.logout();
    } catch (error) {
      console.warn(
        'No se pudo cerrar la sesión:',
        error
      );
    } finally {
      location.href =
        'UrbanSociety.html';
    }
  }

  async function initAccount() {
    try {
      if (
        typeof iniciarBackendless !==
        'function'
      ) {
        location.replace(
          'UrbanSociety.html'
        );

        return;
      }

      if (!iniciarBackendless()) {
        location.replace(
          'UrbanSociety.html'
        );

        return;
      }

      const user =
        await Backendless.UserService
          .getCurrentUser();

      if (!user) {
        location.replace(
          'UrbanSociety.html?login=1'
        );

        return;
      }

      accountUser = user;

      renderIdentity();

      await loadOrders();

      document
        .querySelectorAll('.account-nav-link')
        .forEach(link => {
          link.addEventListener(
            'click',
            event => {
              event.preventDefault();

              showSection(
                link.dataset.accountSection
              );
            }
          );
        });

      const profileForm =
        $('account-profile-form');

      if (profileForm) {
        profileForm.addEventListener(
          'submit',
          saveProfile
        );
      }

      const logoutButton =
        $('account-logout');

      if (logoutButton) {
        logoutButton.addEventListener(
          'click',
          logout
        );
      }

      const refreshButton =
        $('account-refresh-orders');

      if (refreshButton) {
        refreshButton.addEventListener(
          'click',
          () => loadOrders(true)
        );
      }

      const initialSection =
        location.hash
          ? location.hash.substring(1)
          : 'overview';

      showSection(initialSection);

    } catch (error) {
      console.error(
        'Error inicializando cuenta:',
        error
      );

      location.replace(
        'UrbanSociety.html'
      );
    }
  }

  document.addEventListener(
    'DOMContentLoaded',
    initAccount
  );

})();
