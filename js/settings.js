/* =========================================================
   URBAN SOCIETY
   STORE SETTINGS
========================================================= */
(function () {
  if (window.__urbanStoreSettingsInstalled) return;
  window.__urbanStoreSettingsInstalled = true;

  function el(id) {
    return document.getElementById(id);
  }

  function renderPreview() {
    el('preview-store-name').textContent = (el('settings-store-name')?.value || 'URBAN SOCIETY').toUpperCase();
    el('preview-slogan').textContent = el('settings-slogan')?.value || '';
    el('preview-phone').textContent = el('settings-phone')?.value || '';
    el('preview-address').textContent = el('settings-address')?.value || '';
    el('preview-footer').textContent = el('settings-ticket-footer')?.value || 'Gracias por tu compra.';
  }

  async function loadSettings() {
    const status = el('settings-status');
    try {
      const { data, error } = await window.urbanSupabase
        .from('store_settings')
        .select('*')
        .eq('id', 'main')
        .single();

      if (error) throw error;

      el('settings-store-name').value = data.store_name || 'Urban Society';
      el('settings-slogan').value = data.slogan || '';
      el('settings-phone').value = data.phone || '';
      el('settings-address').value = data.address || '';
      el('settings-ticket-footer').value = data.ticket_footer || 'Gracias por tu compra.';
      el('settings-low-stock').value = Number(data.low_stock_threshold ?? 5);
      renderPreview();
      if (status) status.textContent = 'Configuración cargada.';
    } catch (error) {
      console.error('Error cargando configuración:', error);
      if (status) status.textContent = 'No se pudo cargar la configuración.';
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    const button = el('settings-save');
    const status = el('settings-status');
    const lowStock = Number(el('settings-low-stock')?.value || 0);

    if (!Number.isInteger(lowStock) || lowStock < 0 || lowStock > 9999) {
      alert('Escribe un valor válido para stock bajo.');
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'GUARDANDO...';
    }
    if (status) status.textContent = 'Guardando cambios...';

    try {
      const payload = {
        store_name: el('settings-store-name').value.trim() || 'Urban Society',
        slogan: el('settings-slogan').value.trim(),
        phone: el('settings-phone').value.trim(),
        address: el('settings-address').value.trim(),
        ticket_footer: el('settings-ticket-footer').value.trim() || 'Gracias por tu compra.',
        low_stock_threshold: lowStock,
        updated_at: new Date().toISOString()
      };

      const { error } = await window.urbanSupabase
        .from('store_settings')
        .update(payload)
        .eq('id', 'main');

      if (error) throw error;
      renderPreview();
      if (status) status.textContent = '✓ Configuración guardada correctamente.';
    } catch (error) {
      console.error('Error guardando configuración:', error);
      if (status) status.textContent = 'No se pudo guardar la configuración.';
      alert('No se pudo guardar la configuración.\n\n' + (error?.message || 'Error desconocido.'));
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'GUARDAR CONFIGURACIÓN';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const authorized = typeof verificarOwner === 'function' ? await verificarOwner() : false;
    if (!authorized) return;

    el('settings-form')?.addEventListener('submit', saveSettings);
    ['settings-store-name','settings-slogan','settings-phone','settings-address','settings-ticket-footer']
      .forEach(id => el(id)?.addEventListener('input', renderPreview));

    await loadSettings();
  });
})();
