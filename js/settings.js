/* =========================================================
   URBAN SOCIETY
   STORE SETTINGS
========================================================= */
(function () {
  if (window.__urbanStoreSettingsInstalled) return;
  window.__urbanStoreSettingsInstalled = true;

  const el = id => document.getElementById(id);

  function renderPreview() {
    if (el('preview-store-name')) el('preview-store-name').textContent = (el('settings-store-name')?.value || 'URBAN SOCIETY').toUpperCase();
    if (el('preview-slogan')) el('preview-slogan').textContent = el('settings-slogan')?.value || '';
    if (el('preview-phone')) el('preview-phone').textContent = el('settings-show-phone')?.checked ? (el('settings-phone')?.value || '') : '';
    if (el('preview-address')) el('preview-address').textContent = el('settings-show-address')?.checked ? (el('settings-address')?.value || '') : '';
    if (el('preview-footer')) el('preview-footer').textContent = el('settings-ticket-footer')?.value || 'Gracias por tu compra.';
    if (el('preview-policy')) el('preview-policy').textContent = el('settings-return-policy')?.value || '';
    if (el('preview-qr')) el('preview-qr').textContent = el('settings-store-url')?.value ? '▣ QR hacia la tienda online' : '';
  }

  async function loadSettings() {
    const status = el('settings-status');
    try {
      const { data, error } = await window.urbanSupabase.from('store_settings').select('*').eq('id', 'main').single();
      if (error) throw error;
      el('settings-store-name').value = data.store_name || 'Urban Society';
      el('settings-slogan').value = data.slogan || '';
      el('settings-phone').value = data.phone || '';
      el('settings-address').value = data.address || '';
      el('settings-store-url').value = data.store_url || '';
      el('settings-ticket-footer').value = data.ticket_footer || 'Gracias por tu compra.';
      el('settings-return-policy').value = data.return_policy || '';
      el('settings-low-stock').value = Number(data.low_stock_threshold ?? 5);
      el('settings-show-phone').checked = data.receipt_show_phone !== false;
      el('settings-show-address').checked = data.receipt_show_address !== false;
      renderPreview();
      if (status) status.textContent = 'Configuración cargada.';
    } catch (error) {
      console.error('Error cargando configuración:', error);
      if (status) status.textContent = 'No se pudo cargar la configuración.';
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    const button = el('settings-save'), status = el('settings-status'), lowStock = Number(el('settings-low-stock')?.value || 0);
    if (!Number.isInteger(lowStock) || lowStock < 0 || lowStock > 9999) return alert('Escribe un valor válido para stock bajo.');
    const storeUrl = el('settings-store-url').value.trim();
    if (storeUrl && !/^https?:\/\//i.test(storeUrl)) return alert('El enlace de la tienda debe comenzar con http:// o https://');
    if (button) { button.disabled = true; button.textContent = 'GUARDANDO...'; }
    if (status) status.textContent = 'Guardando cambios...';
    try {
      const payload = {
        store_name: el('settings-store-name').value.trim() || 'Urban Society',
        slogan: el('settings-slogan').value.trim(),
        phone: el('settings-phone').value.trim(),
        address: el('settings-address').value.trim(),
        store_url: storeUrl,
        ticket_footer: el('settings-ticket-footer').value.trim() || 'Gracias por tu compra.',
        return_policy: el('settings-return-policy').value.trim() || 'Cambios sujetos a disponibilidad y condiciones de la tienda.',
        low_stock_threshold: lowStock,
        receipt_show_phone: el('settings-show-phone').checked,
        receipt_show_address: el('settings-show-address').checked,
        updated_at: new Date().toISOString()
      };
      const { error } = await window.urbanSupabase.from('store_settings').update(payload).eq('id', 'main');
      if (error) throw error;
      renderPreview();
      window.refreshUrbanAlerts?.();
      if (status) status.textContent = '✓ Configuración guardada correctamente.';
    } catch (error) {
      console.error('Error guardando configuración:', error);
      if (status) status.textContent = 'No se pudo guardar la configuración.';
      alert('No se pudo guardar la configuración.\n\n' + (error?.message || 'Error desconocido.'));
    } finally {
      if (button) { button.disabled = false; button.textContent = 'GUARDAR CONFIGURACIÓN'; }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (await window.verificarAcceso?.('settings') === false) return;
    el('settings-form')?.addEventListener('submit', saveSettings);
    ['settings-store-name','settings-slogan','settings-phone','settings-address','settings-store-url','settings-ticket-footer','settings-return-policy']
      .forEach(id => el(id)?.addEventListener('input', renderPreview));
    ['settings-show-phone','settings-show-address'].forEach(id => el(id)?.addEventListener('change', renderPreview));
    await loadSettings();
  });
})();
