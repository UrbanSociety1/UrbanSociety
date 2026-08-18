/* =========================================================
   URBAN SOCIETY
   DEDICATED BACKOFFICE PAGES
========================================================= */
(function () {
  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  if (page !== 'admin.html') return;

  function applyDedicatedPages() {
    /* Inicio debe ser únicamente dashboard. Las herramientas viven en su pantalla. */
    document.querySelectorAll('.admin-section').forEach(section => {
      section.style.display = 'none';
    });

    const replacements = new Map([
      ['admin.html#product-form', 'products.html'],
      ['admin.html#admin-orders', 'orders.html'],
      ['pos.html#pos-cash-section', 'cash.html']
    ]);

    document.querySelectorAll('a[href]').forEach(link => {
      const replacement = replacements.get(link.getAttribute('href'));
      if (replacement) link.setAttribute('href', replacement);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyDedicatedPages();
    setTimeout(applyDedicatedPages, 250);
  });
})();
