/* =========================================================
   URBAN SOCIETY
   CUSTOMER ACCOUNT ENTRY POINT
========================================================= */
(function () {
  if (window.__urbanCustomerAccountLinkInstalled) return;
  window.__urbanCustomerAccountLinkInstalled = true;

  function goAccount(section = 'overview') {
    const suffix = section ? `#${section}` : '';
    location.href = `account.html${suffix}`;
  }

  function installAccountMenu() {
    const original = window.mostrarMenuCuenta;
    if (typeof original !== 'function' || original.__urbanCustomerAccountWrapped) return;

    function menuWithAccount() {
      original();
      const menu = document.getElementById('account-menu');
      if (!menu) return;

      document.getElementById('my-orders-menu-button')?.remove();
      document.getElementById('customer-account-main-button')?.remove();
      document.getElementById('customer-account-orders-button')?.remove();

      const logout = Array.from(menu.querySelectorAll('button'))
        .find(button => /cerrar sesi[oó]n/i.test(button.textContent || ''));

      const mainButton = document.createElement('button');
      mainButton.id = 'customer-account-main-button';
      mainButton.type = 'button';
      mainButton.className = 'btn btn-primary full';
      mainButton.style.marginBottom = '10px';
      mainButton.textContent = 'MI CUENTA';
      mainButton.addEventListener('click', () => goAccount('overview'));

      const ordersButton = document.createElement('button');
      ordersButton.id = 'customer-account-orders-button';
      ordersButton.type = 'button';
      ordersButton.className = 'btn btn-secondary full';
      ordersButton.style.marginBottom = '10px';
      ordersButton.textContent = 'MIS PEDIDOS';
      ordersButton.addEventListener('click', () => goAccount('orders'));

      if (logout) {
        menu.insertBefore(ordersButton, logout);
        menu.insertBefore(mainButton, ordersButton);
      } else {
        menu.append(mainButton, ordersButton);
      }
    }

    menuWithAccount.__urbanCustomerAccountWrapped = true;
    window.mostrarMenuCuenta = menuWithAccount;
  }

  document.addEventListener('DOMContentLoaded', () => {
    installAccountMenu();

    const params = new URLSearchParams(location.search);
    if (params.get('login') === '1' && typeof window.mostrarLogin === 'function') {
      window.mostrarLogin();
      history.replaceState(null, '', location.pathname + location.hash);
    }
  });

  window.irAMiCuenta = goAccount;
})();
