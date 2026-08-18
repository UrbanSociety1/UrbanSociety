/* =========================================================
   URBAN SOCIETY
   CASH CUT - APERTURA, MOVIMIENTOS Y CORTE DE CAJA
========================================================= */

(function () {
  if (window.__urbanCashCutInstalled) return;
  window.__urbanCashCutInstalled = true;

  let cashState = { open: false };
  let cashLastCut = null;
  let refreshTimer = null;

  const money = value => {
    if (typeof window.posMoney === "function") return window.posMoney(value);
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(Number(value || 0));
  };

  const escapeHtml = value => {
    if (typeof window.posEscape === "function") return window.posEscape(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const toast = message => {
    if (typeof window.posToast === "function") window.posToast(message);
    else alert(message);
  };

  function cashEl(id) {
    return document.getElementById(id);
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function differenceLabel(value) {
    const amount = Number(value || 0);
    if (Math.abs(amount) < 0.005) return "Cuadra exacto";
    return amount > 0 ? `Sobra ${money(amount)}` : `Falta ${money(Math.abs(amount))}`;
  }

  function ensureCashUI() {
    if (cashEl("pos-cash-section")) return;

    const section = document.createElement("section");
    section.id = "pos-cash-section";
    section.className = "pos-cash-section";
    section.innerHTML = `
      <div class="cash-head">
        <div>
          <span class="eyebrow">CONTROL DE CAJA</span>
          <div class="cash-title-row">
            <h2>Caja del día</h2>
            <span id="cash-status-badge" class="cash-badge closed">CERRADA</span>
          </div>
          <p id="cash-status-copy" class="cash-muted">Abre caja antes de comenzar a cobrar.</p>
        </div>
        <div class="cash-actions">
          <button id="cash-open-button" type="button" class="cash-primary">ABRIR CAJA</button>
          <button id="cash-movement-button" type="button" class="cash-secondary" hidden>MOVIMIENTO</button>
          <button id="cash-close-button" type="button" class="cash-danger" hidden>CORTE DE CAJA</button>
        </div>
      </div>

      <div id="cash-live" class="cash-live" hidden>
        <div class="cash-metrics">
          <article><span>Fondo inicial</span><strong id="cash-opening">$0.00</strong></article>
          <article><span>Ventas efectivo</span><strong id="cash-sales-cash">$0.00</strong></article>
          <article><span>Tarjeta</span><strong id="cash-sales-card">$0.00</strong></article>
          <article><span>Transferencia</span><strong id="cash-sales-transfer">$0.00</strong></article>
          <article><span>Entradas</span><strong id="cash-entries">$0.00</strong></article>
          <article><span>Gastos</span><strong id="cash-expenses">$0.00</strong></article>
          <article class="expected"><span>Efectivo esperado</span><strong id="cash-expected">$0.00</strong></article>
        </div>

        <div class="cash-lower-grid">
          <div>
            <div class="cash-subhead">
              <strong>Movimientos de efectivo</strong>
              <span id="cash-sales-count">0 ventas</span>
            </div>
            <div id="cash-movements" class="cash-movements">
              <div class="cash-empty">Sin movimientos adicionales.</div>
            </div>
          </div>
          <div class="cash-total-card">
            <span>Venta total de la apertura</span>
            <strong id="cash-total-sales">$0.00</strong>
            <small>Incluye efectivo, tarjeta y transferencia.</small>
          </div>
        </div>
      </div>
    `;

    const posLayout = document.querySelector(".pos-layout");
    if (posLayout) posLayout.before(section);
    else document.body.appendChild(section);

    const history = document.createElement("section");
    history.id = "pos-cash-history-section";
    history.className = "pos-cash-history-section";
    history.innerHTML = `
      <div class="cash-history-head">
        <div>
          <span class="eyebrow">CIERRES</span>
          <h2>Cortes de caja recientes</h2>
        </div>
        <button id="cash-history-refresh" type="button" class="cash-secondary">↻ Actualizar</button>
      </div>
      <div id="cash-history" class="cash-history">
        <div class="cash-empty">Cargando cortes...</div>
      </div>
    `;

    const salesHistory = document.querySelector(".pos-history-section");
    if (salesHistory) salesHistory.after(history);
    else document.body.appendChild(history);

    const lock = document.createElement("div");
    lock.id = "cash-sale-lock";
    lock.className = "cash-sale-lock";
    lock.innerHTML = `<strong>Caja cerrada</strong><span>Abre caja para registrar ventas físicas.</span>`;
    const saleForm = cashEl("pos-sale-form");
    if (saleForm) saleForm.before(lock);

    const modal = document.createElement("div");
    modal.id = "cash-modal";
    modal.className = "cash-modal-overlay";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `<div id="cash-modal-card" class="cash-modal-card"></div>`;
    modal.addEventListener("click", event => {
      if (event.target === modal) closeCashModal();
    });
    document.body.appendChild(modal);

    cashEl("cash-open-button")?.addEventListener("click", showOpenCashModal);
    cashEl("cash-movement-button")?.addEventListener("click", showMovementModal);
    cashEl("cash-close-button")?.addEventListener("click", showCloseCashModal);
    cashEl("cash-history-refresh")?.addEventListener("click", () => loadCashHistory());

    saleForm?.addEventListener("submit", event => {
      if (cashState.open) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toast("Abre caja antes de cobrar una venta.");
      showOpenCashModal();
    }, true);
  }

  function setSaleLock() {
    const lock = cashEl("cash-sale-lock");
    if (lock) lock.hidden = Boolean(cashState.open);

    const cartPanel = document.querySelector(".pos-cart-panel");
    if (cartPanel) cartPanel.classList.toggle("cash-is-closed", !cashState.open);
  }

  function renderCashState() {
    const open = Boolean(cashState.open);
    const badge = cashEl("cash-status-badge");
    const copy = cashEl("cash-status-copy");

    if (badge) {
      badge.textContent = open ? `ABIERTA #${cashState.folio || ""}` : "CERRADA";
      badge.className = `cash-badge ${open ? "open" : "closed"}`;
    }

    if (copy) {
      copy.textContent = open
        ? `Abierta ${formatDate(cashState.openedAt)} · Efectivo esperado ${money(cashState.expectedCash)}`
        : "Abre caja antes de comenzar a cobrar.";
    }

    if (cashEl("cash-open-button")) cashEl("cash-open-button").hidden = open;
    if (cashEl("cash-movement-button")) cashEl("cash-movement-button").hidden = !open;
    if (cashEl("cash-close-button")) cashEl("cash-close-button").hidden = !open;
    if (cashEl("cash-live")) cashEl("cash-live").hidden = !open;

    if (open) {
      cashEl("cash-opening").textContent = money(cashState.openingCash);
      cashEl("cash-sales-cash").textContent = money(cashState.cashSales);
      cashEl("cash-sales-card").textContent = money(cashState.cardSales);
      cashEl("cash-sales-transfer").textContent = money(cashState.transferSales);
      cashEl("cash-entries").textContent = money(cashState.cashEntries);
      cashEl("cash-expenses").textContent = money(cashState.cashExpenses);
      cashEl("cash-expected").textContent = money(cashState.expectedCash);
      cashEl("cash-total-sales").textContent = money(cashState.totalSales);
      const count = Number(cashState.salesCount || 0);
      cashEl("cash-sales-count").textContent = `${count} venta${count === 1 ? "" : "s"}`;
    }

    setSaleLock();
  }

  async function loadCashState() {
    if (!window.urbanSupabase) return;

    try {
      const { data, error } = await window.urbanSupabase.rpc("get_pos_cash_summary");
      if (error) throw error;
      cashState = data || { open: false };
      renderCashState();
      await loadCurrentMovements();
    } catch (error) {
      console.error("Error cargando estado de caja:", error);
      cashState = { open: false };
      renderCashState();
    }
  }

  async function loadCurrentMovements() {
    const container = cashEl("cash-movements");
    if (!container) return;

    if (!cashState.open || !cashState.sessionId) {
      container.innerHTML = '<div class="cash-empty">Sin caja abierta.</div>';
      return;
    }

    const { data, error } = await window.urbanSupabase
      .from("pos_cash_movements")
      .select("id,created_at,movement_type,amount,concept")
      .eq("session_id", cashState.sessionId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error cargando movimientos:", error);
      return;
    }

    const rows = data || [];
    if (!rows.length) {
      container.innerHTML = '<div class="cash-empty">Sin movimientos adicionales.</div>';
      return;
    }

    container.innerHTML = rows.map(row => `
      <div class="cash-movement-row ${row.movement_type === "Gasto" ? "expense" : "entry"}">
        <div>
          <strong>${escapeHtml(row.concept)}</strong>
          <small>${escapeHtml(formatDate(row.created_at))} · ${escapeHtml(row.movement_type)}</small>
        </div>
        <b>${row.movement_type === "Gasto" ? "−" : "+"}${money(row.amount)}</b>
      </div>
    `).join("");
  }

  async function loadCashHistory() {
    const container = cashEl("cash-history");
    if (!container || !window.urbanSupabase) return;

    const { data, error } = await window.urbanSupabase
      .from("pos_cash_sessions")
      .select("*")
      .eq("status", "Cerrada")
      .order("closed_at", { ascending: false })
      .limit(15);

    if (error) {
      container.innerHTML = `<div class="cash-empty">No se pudieron cargar los cortes.</div>`;
      console.error("Error cargando cortes:", error);
      return;
    }

    const rows = data || [];
    if (!rows.length) {
      container.innerHTML = '<div class="cash-empty">Todavía no hay cortes de caja.</div>';
      return;
    }

    container.innerHTML = rows.map(row => {
      const diff = Number(row.difference || 0);
      const diffClass = Math.abs(diff) < .005 ? "exact" : diff > 0 ? "over" : "short";
      return `
        <article class="cash-cut-card">
          <div class="cash-cut-folio">#${row.folio}</div>
          <div class="cash-cut-main">
            <strong>${escapeHtml(formatDate(row.closed_at))}</strong>
            <small>${Number(row.sales_count || 0)} venta${Number(row.sales_count || 0) === 1 ? "" : "s"} · Total ${money(row.total_sales)}</small>
            <div class="cash-cut-chips">
              <span>Efectivo ${money(row.cash_sales)}</span>
              <span>Tarjeta ${money(row.card_sales)}</span>
              <span>Transferencia ${money(row.transfer_sales)}</span>
            </div>
          </div>
          <div class="cash-cut-side">
            <span class="cash-diff ${diffClass}">${escapeHtml(differenceLabel(diff))}</span>
            <small>Esperado ${money(row.expected_cash)} · Contado ${money(row.counted_cash)}</small>
            <button type="button" onclick="printCashCutById('${escapeHtml(row.id)}')">Imprimir corte</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function showCashModal(html) {
    const overlay = cashEl("cash-modal");
    const card = cashEl("cash-modal-card");
    if (!overlay || !card) return;
    card.innerHTML = html;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeCashModal() {
    const overlay = cashEl("cash-modal");
    if (!overlay) return;
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }

  function showOpenCashModal() {
    if (cashState.open) return;
    showCashModal(`
      <button type="button" class="cash-modal-close" onclick="closeCashModal()">×</button>
      <span class="eyebrow">INICIO DEL DÍA</span>
      <h2>Abrir caja</h2>
      <p class="cash-muted">Escribe cuánto efectivo dejas como fondo para comenzar.</p>
      <form id="cash-open-form" class="cash-form">
        <label>Fondo inicial
          <input id="cash-opening-input" type="number" min="0" step="0.01" value="0" inputmode="decimal" required>
        </label>
        <label>Nota (opcional)
          <textarea id="cash-open-notes" rows="2" maxlength="500" placeholder="Ej. Fondo de caja del turno"></textarea>
        </label>
        <button type="submit" class="cash-primary full">ABRIR CAJA</button>
      </form>
    `);

    cashEl("cash-open-form")?.addEventListener("submit", openCash);
    setTimeout(() => cashEl("cash-opening-input")?.focus(), 50);
  }

  async function openCash(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const openingCash = Number(cashEl("cash-opening-input")?.value || 0);
    const notes = cashEl("cash-open-notes")?.value.trim() || "";

    if (!Number.isFinite(openingCash) || openingCash < 0) {
      toast("Escribe un fondo inicial válido.");
      return;
    }

    button.disabled = true;
    button.textContent = "ABRIENDO...";

    try {
      const { data, error } = await window.urbanSupabase.rpc("open_pos_cash", {
        payload: { openingCash, notes }
      });
      if (error) throw error;
      closeCashModal();
      toast(`Caja #${data.folio} abierta con ${money(data.openingCash)}.`);
      await Promise.all([loadCashState(), loadCashHistory()]);
    } catch (error) {
      alert("No se pudo abrir la caja.\n\n" + (error?.message || "Error desconocido."));
    } finally {
      button.disabled = false;
      button.textContent = "ABRIR CAJA";
    }
  }

  function showMovementModal() {
    if (!cashState.open) return showOpenCashModal();
    showCashModal(`
      <button type="button" class="cash-modal-close" onclick="closeCashModal()">×</button>
      <span class="eyebrow">EFECTIVO</span>
      <h2>Registrar movimiento</h2>
      <p class="cash-muted">Usa Entrada para dinero que agregas a caja y Gasto para dinero que sale.</p>
      <form id="cash-movement-form" class="cash-form">
        <label>Tipo
          <select id="cash-movement-type" required>
            <option value="Entrada">Entrada de efectivo</option>
            <option value="Gasto">Gasto / salida de efectivo</option>
          </select>
        </label>
        <label>Monto
          <input id="cash-movement-amount" type="number" min="0.01" step="0.01" inputmode="decimal" required>
        </label>
        <label>Concepto
          <input id="cash-movement-concept" type="text" minlength="2" maxlength="200" placeholder="Ej. Compra de bolsas" required>
        </label>
        <button type="submit" class="cash-primary full">GUARDAR MOVIMIENTO</button>
      </form>
    `);

    cashEl("cash-movement-form")?.addEventListener("submit", saveMovement);
    setTimeout(() => cashEl("cash-movement-amount")?.focus(), 50);
  }

  async function saveMovement(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const movementType = cashEl("cash-movement-type")?.value || "Entrada";
    const amount = Number(cashEl("cash-movement-amount")?.value || 0);
    const concept = cashEl("cash-movement-concept")?.value.trim() || "";

    if (!Number.isFinite(amount) || amount <= 0 || concept.length < 2) {
      toast("Completa correctamente el movimiento.");
      return;
    }

    button.disabled = true;
    button.textContent = "GUARDANDO...";

    try {
      const { error } = await window.urbanSupabase.rpc("add_pos_cash_movement", {
        payload: { movementType, amount, concept }
      });
      if (error) throw error;
      closeCashModal();
      toast(`${movementType} de ${money(amount)} registrada.`);
      await loadCashState();
    } catch (error) {
      alert("No se pudo guardar el movimiento.\n\n" + (error?.message || "Error desconocido."));
    } finally {
      button.disabled = false;
      button.textContent = "GUARDAR MOVIMIENTO";
    }
  }

  function showCloseCashModal() {
    if (!cashState.open) return;

    try {
      if (Array.isArray(posCart) && posCart.length) {
        toast("Termina o vacía la venta actual antes de cerrar caja.");
        return;
      }
    } catch (_) {}

    showCashModal(`
      <button type="button" class="cash-modal-close" onclick="closeCashModal()">×</button>
      <span class="eyebrow">FIN DEL TURNO</span>
      <h2>Corte de caja #${escapeHtml(cashState.folio || "")}</h2>
      <p class="cash-muted">Cuenta únicamente el efectivo físico que tienes en caja.</p>

      <div class="cash-close-summary">
        <div><span>Fondo inicial</span><strong>${money(cashState.openingCash)}</strong></div>
        <div><span>Ventas efectivo</span><strong>${money(cashState.cashSales)}</strong></div>
        <div><span>Entradas</span><strong>+${money(cashState.cashEntries)}</strong></div>
        <div><span>Gastos</span><strong>−${money(cashState.cashExpenses)}</strong></div>
        <div class="expected"><span>Debe haber en caja</span><strong>${money(cashState.expectedCash)}</strong></div>
      </div>

      <form id="cash-close-form" class="cash-form">
        <label>Efectivo contado
          <input id="cash-counted-input" type="number" min="0" step="0.01" inputmode="decimal" required>
        </label>
        <div class="cash-live-diff">
          <span>Diferencia</span>
          <strong id="cash-close-difference">—</strong>
        </div>
        <label>Nota de cierre (opcional)
          <textarea id="cash-close-notes" rows="2" maxlength="500" placeholder="Observaciones del corte"></textarea>
        </label>
        <button type="submit" class="cash-danger full">CERRAR Y GUARDAR CORTE</button>
      </form>
    `);

    cashEl("cash-counted-input")?.addEventListener("input", updateCloseDifference);
    cashEl("cash-close-form")?.addEventListener("submit", closeCash);
    setTimeout(() => cashEl("cash-counted-input")?.focus(), 50);
  }

  function updateCloseDifference() {
    const input = cashEl("cash-counted-input");
    const output = cashEl("cash-close-difference");
    if (!input || !output || input.value === "") {
      if (output) output.textContent = "—";
      return;
    }
    const diff = Number(input.value) - Number(cashState.expectedCash || 0);
    output.textContent = differenceLabel(diff);
    output.className = Math.abs(diff) < .005 ? "exact" : diff > 0 ? "over" : "short";
  }

  async function closeCash(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const countedCash = Number(cashEl("cash-counted-input")?.value);
    const notes = cashEl("cash-close-notes")?.value.trim() || "";

    if (!Number.isFinite(countedCash) || countedCash < 0) {
      toast("Escribe el efectivo que contaste.");
      return;
    }

    button.disabled = true;
    button.textContent = "CERRANDO...";

    try {
      const { data, error } = await window.urbanSupabase.rpc("close_pos_cash", {
        payload: { countedCash, notes }
      });
      if (error) throw error;

      cashLastCut = data;
      closeCashModal();
      cashState = { open: false };
      renderCashState();
      await loadCashHistory();

      const message = [
        `Corte #${data.folio} guardado.`,
        `Ventas: ${money(data.totalSales)}`,
        `Efectivo esperado: ${money(data.expectedCash)}`,
        `Efectivo contado: ${money(data.countedCash)}`,
        differenceLabel(data.difference)
      ].join("\n");

      if (confirm(message + "\n\n¿Imprimir corte?")) {
        printCashCut(data);
      }
    } catch (error) {
      alert("No se pudo cerrar la caja.\n\n" + (error?.message || "Error desconocido."));
    } finally {
      button.disabled = false;
      button.textContent = "CERRAR Y GUARDAR CORTE";
    }
  }

  async function printCashCutById(id) {
    const { data, error } = await window.urbanSupabase
      .from("pos_cash_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      alert("No se pudo cargar el corte.");
      return;
    }

    printCashCut({
      folio: data.folio,
      openedAt: data.opened_at,
      closedAt: data.closed_at,
      openingCash: data.opening_cash,
      cashSales: data.cash_sales,
      cardSales: data.card_sales,
      transferSales: data.transfer_sales,
      cashEntries: data.cash_entries,
      cashExpenses: data.cash_expenses,
      totalSales: data.total_sales,
      salesCount: data.sales_count,
      expectedCash: data.expected_cash,
      countedCash: data.counted_cash,
      difference: data.difference,
      closeNotes: data.close_notes
    });
  }

  function printCashCut(cut) {
    const win = window.open("", "_blank", "width=430,height=760");
    if (!win) {
      alert("El navegador bloqueó la ventana del corte.");
      return;
    }

    const diff = Number(cut.difference || 0);
    const rows = [
      ["Fondo inicial", money(cut.openingCash)],
      ["Ventas efectivo", money(cut.cashSales)],
      ["Ventas tarjeta", money(cut.cardSales)],
      ["Transferencias", money(cut.transferSales)],
      ["Entradas efectivo", money(cut.cashEntries)],
      ["Gastos efectivo", money(cut.cashExpenses)],
      ["Total vendido", money(cut.totalSales)],
      ["Efectivo esperado", money(cut.expectedCash)],
      ["Efectivo contado", money(cut.countedCash)],
      ["Diferencia", differenceLabel(diff)]
    ];

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Corte #${escapeHtml(cut.folio)}</title><style>
      body{font-family:monospace;width:310px;margin:20px auto;color:#000}h1,h2,p{text-align:center;margin:6px 0}hr{border:0;border-top:1px dashed #000;margin:14px 0}.row{display:flex;justify-content:space-between;gap:12px;margin:7px 0}.small{font-size:11px}.strong{font-weight:700}.note{white-space:pre-wrap;border-top:1px dashed #000;padding-top:10px;margin-top:12px}@media print{button{display:none}body{margin:0 auto}}
    </style></head><body>
      <h1>URBAN SOCIETY</h1><p>CORTE DE CAJA #${escapeHtml(cut.folio)}</p>
      <p class="small">Apertura: ${escapeHtml(formatDate(cut.openedAt))}</p>
      <p class="small">Cierre: ${escapeHtml(formatDate(cut.closedAt))}</p>
      <hr>
      ${rows.map(([label, value]) => `<div class="row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      <hr>
      <div class="row strong"><span>Ventas</span><span>${Number(cut.salesCount || 0)}</span></div>
      ${cut.closeNotes ? `<div class="note">Nota: ${escapeHtml(cut.closeNotes)}</div>` : ""}
      <p class="small">Urban Society · Punto de venta</p>
      <button onclick="window.print()">Imprimir</button>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  function scheduleCashRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => loadCashState(), 180);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    ensureCashUI();
    renderCashState();

    try {
      await Promise.all([loadCashState(), loadCashHistory()]);
    } catch (error) {
      console.error("No se pudo iniciar el módulo de caja:", error);
    }

    cashEl("pos-refresh")?.addEventListener("click", scheduleCashRefresh);

    const history = cashEl("pos-history");
    if (history) {
      const observer = new MutationObserver(scheduleCashRefresh);
      observer.observe(history, { childList: true, subtree: true });
    }
  });

  window.closeCashModal = closeCashModal;
  window.showOpenCashModal = showOpenCashModal;
  window.showMovementModal = showMovementModal;
  window.showCloseCashModal = showCloseCashModal;
  window.printCashCutById = printCashCutById;
  window.printCashCut = printCashCut;
  window.loadCashState = loadCashState;
  window.loadCashHistory = loadCashHistory;
})();
