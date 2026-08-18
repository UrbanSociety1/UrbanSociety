/* =========================================================
   URBAN SOCIETY
   ADMIN DASHBOARD
========================================================= */
(function () {
  if (window.__urbanAdminDashboardInstalled) return;
  window.__urbanAdminDashboardInstalled = true;
  const currentPage=(location.pathname.split('/').pop()||'').toLowerCase();if(currentPage!=='admin.html')return;
  const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0));
  const escapeHtml=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  function formatDate(value){if(!value)return'';const d=new Date(value);if(Number.isNaN(d.getTime()))return'';return new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(d);}
  function todayLabel(){return new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'}).format(new Date());}
  function greeting(){const h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';}
  function localDayStartIso(){const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate(),0,0,0,0).toISOString();}

  function ensureDashboard(){
    let dashboard=document.getElementById('admin-dashboard');if(dashboard)return dashboard;
    const title=document.querySelector('.admin-title'),stats=document.querySelector('.stats');if(!title||!stats)return null;
    title.querySelector('h2')?.replaceChildren(document.createTextNode('Inicio'));const subtitle=title.querySelector('p');if(subtitle)subtitle.textContent='Resumen operativo de Urban Society.';
    dashboard=document.createElement('section');dashboard.id='admin-dashboard';dashboard.className='admin-dashboard';dashboard.innerHTML=`
      <div class="admin-dashboard-hero"><div><span class="admin-dashboard-eyebrow">PANEL OPERATIVO</span><h2>${escapeHtml(greeting())}</h2><p>Revisa ventas, caja, pedidos y existencias desde un solo lugar.</p></div><div class="admin-dashboard-date">${escapeHtml(todayLabel())}</div></div>
      <div id="admin-dashboard-metrics" class="admin-dashboard-metrics"><div class="admin-dashboard-loading">Cargando resumen...</div></div>
      <div class="admin-dashboard-main-grid">
        <div class="admin-dashboard-panel"><div class="admin-dashboard-panel-head"><h3>Actividad reciente</h3><a href="pos.html" data-dash-permission="pos">Ir al punto de venta →</a></div><div id="admin-dashboard-activity" class="admin-dashboard-activity"><div class="admin-dashboard-loading">Cargando actividad...</div></div></div>
        <div class="admin-dashboard-panel"><div class="admin-dashboard-panel-head"><h3>Stock bajo</h3><a href="products.html" data-dash-permission="products">Administrar productos →</a></div><div id="admin-dashboard-low-stock" class="admin-dashboard-stock-list"><div class="admin-dashboard-loading">Revisando inventario...</div></div></div>
      </div>
      <div class="admin-dashboard-panel"><div class="admin-dashboard-panel-head"><h3>Accesos rápidos</h3><button id="admin-dashboard-refresh" type="button" class="secondary-button">↻ Actualizar</button></div><div class="admin-dashboard-actions">
        <a class="admin-dashboard-action" href="pos.html" data-dash-permission="pos"><span>🧾</span><span><b>Nueva venta</b><small>Punto de venta</small></span></a>
        <a class="admin-dashboard-action" href="products.html" data-dash-permission="products"><span>👟</span><span><b>Productos</b><small>Catálogo e inventario</small></span></a>
        <a class="admin-dashboard-action" href="orders.html" data-dash-permission="orders"><span>📦</span><span><b>Pedidos</b><small>Tienda online</small></span></a>
        <a class="admin-dashboard-action" href="cash.html" data-dash-permission="cash"><span>💵</span><span><b>Caja y cortes</b><small>Control de efectivo</small></span></a>
        <a class="admin-dashboard-action" href="returns.html" data-dash-permission="returns"><span>↩</span><span><b>Devoluciones</b><small>Cambios y reembolsos</small></span></a>
        <a class="admin-dashboard-action" href="inventory.html" data-dash-permission="inventory"><span>⇅</span><span><b>Movimientos</b><small>Historial de stock</small></span></a>
        <a class="admin-dashboard-action" href="reports.html" data-dash-permission="reports"><span>📊</span><span><b>Reportes</b><small>Ventas y rendimiento</small></span></a>
        <a class="admin-dashboard-action" href="customers.html" data-dash-permission="customers"><span>👥</span><span><b>Clientes</b><small>Compras y seguimiento</small></span></a>
        <a class="admin-dashboard-action" href="settings.html" data-dash-permission="settings"><span>⚙️</span><span><b>Configuración</b><small>Datos del negocio</small></span></a>
      </div></div>`;
    stats.before(dashboard);document.body.classList.add('admin-dashboard-ready');return dashboard;
  }

  function applyActionPermissions(){document.querySelectorAll('[data-dash-permission]').forEach(el=>{const p=el.dataset.dashPermission;if(typeof window.urbanCan==='function'&&!window.urbanCan(p))el.remove();});}
  function metric(icon,label,value,detail,extraClass=''){return `<article class="admin-dashboard-metric ${extraClass}"><span class="metric-icon">${icon}</span><span class="metric-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;}
  function renderMetrics(data){const c=document.getElementById('admin-dashboard-metrics');if(!c)return;const cashOpen=Boolean(data.cash?.open),pendingClass=Number(data.pendingOrders||0)>0?'is-alert':'is-good',stockClass=Number(data.lowStock?.length||0)>0?'is-alert':'is-good';c.innerHTML=[metric('🧾','Ventas físicas hoy',money(data.posTodayTotal),`${data.posTodayCount} venta${data.posTodayCount===1?'':'s'} en mostrador`,data.posTodayCount?'is-good':''),metric('🛒','Pedidos online hoy',money(data.onlineTodayTotal),`${data.onlineTodayCount} pedido${data.onlineTodayCount===1?'':'s'} no cancelado${data.onlineTodayCount===1?'':'s'}`),metric(cashOpen?'🟢':'🔒','Caja',cashOpen?money(data.cash.expectedCash):'Cerrada',cashOpen?`Apertura #${data.cash.folio||''} · ${data.cash.salesCount||0} venta${Number(data.cash.salesCount||0)===1?'':'s'}`:'Abre caja antes de cobrar',cashOpen?'is-good is-cash-open':''),metric('📦','Pedidos pendientes',String(data.pendingOrders||0),data.pendingOrders?'Requieren seguimiento':'No tienes pedidos pendientes',pendingClass),metric('⚠️','Stock bajo',String(data.lowStock?.length||0),`Umbral: ${data.lowStockThreshold} pieza${data.lowStockThreshold===1?'':'s'}`,stockClass),metric('👟','Productos activos',String(data.activeProducts||0),`${data.totalProducts||0} producto${data.totalProducts===1?'':'s'} en total`)].join('');}
  function renderLowStock(products){const c=document.getElementById('admin-dashboard-low-stock');if(!c)return;if(!products.length){c.innerHTML='<div class="admin-dashboard-empty">✓ No hay productos con stock bajo.</div>';return;}c.innerHTML=products.slice(0,6).map(p=>`<div class="admin-dashboard-stock-row"><img src="${escapeHtml(p.image||'images/Logo Urban.png')}" alt="${escapeHtml(p.name||'Producto')}" onerror="this.src='images/Logo Urban.png'"><div><strong>${escapeHtml(p.name||'Producto')}</strong><small>${escapeHtml(p.category||'General')}</small></div><span class="admin-dashboard-stock-count">${Number(p.stock||0)}</span></div>`).join('');}
  function renderActivity(posSales,orders){const c=document.getElementById('admin-dashboard-activity');if(!c)return;const activity=[...(posSales||[]).map(s=>({date:s.created_at,title:`Venta física #${s.folio}`,subtitle:`${s.customer_name||'Venta mostrador'} · ${s.payment_method||''}`,amount:Number(s.total||0)-Number(s.returned_total||0),icon:'🧾'})),...(orders||[]).map(o=>({date:o.created_at,title:'Pedido online',subtitle:`${o.customer_name||'Cliente'} · ${o.status||'Pendiente'}`,amount:Number(o.total||0),icon:'📦'}))].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);if(!activity.length){c.innerHTML='<div class="admin-dashboard-empty">Todavía no hay actividad registrada.</div>';return;}c.innerHTML=activity.map(i=>`<div class="admin-dashboard-activity-row"><span class="admin-dashboard-activity-icon">${i.icon}</span><div><strong>${escapeHtml(i.title)}</strong><small>${escapeHtml(i.subtitle)} · ${escapeHtml(formatDate(i.date))}</small></div><strong class="admin-dashboard-activity-amount">${money(i.amount)}</strong></div>`).join('');}

  async function loadDashboard(){if(!window.urbanSupabase)return;const refresh=document.getElementById('admin-dashboard-refresh');if(refresh){refresh.disabled=true;refresh.textContent='Actualizando...';}try{const startToday=localDayStartIso();const [productsRes,settingsRes,pendingRes,posTodayRes,onlineTodayRes,recentPosRes,recentOrdersRes,cashRes]=await Promise.all([
    window.urbanSupabase.from('products').select('id,name,category,image,stock,active,created_at').order('created_at',{ascending:false}),
    window.urbanSupabase.from('store_settings').select('low_stock_threshold').eq('id','main').maybeSingle(),
    window.urbanSupabase.from('orders').select('id',{count:'exact',head:true}).eq('status','Pendiente'),
    window.urbanSupabase.from('pos_sales').select('id,total,returned_total,created_at').gte('created_at',startToday),
    window.urbanSupabase.from('orders').select('id,total,status,created_at').gte('created_at',startToday).neq('status','Cancelado'),
    window.urbanSupabase.from('pos_sales').select('id,folio,created_at,customer_name,payment_method,total,returned_total').order('created_at',{ascending:false}).limit(6),
    window.urbanSupabase.from('orders').select('id,created_at,customer_name,total,status').order('created_at',{ascending:false}).limit(6),
    window.urbanSupabase.rpc('get_pos_cash_summary')
  ]);const responses=[productsRes,pendingRes,posTodayRes,onlineTodayRes,recentPosRes,recentOrdersRes,cashRes];const firstError=responses.find(r=>r?.error)?.error;if(firstError)throw firstError;const products=productsRes.data||[],threshold=Math.max(0,Number(settingsRes.data?.low_stock_threshold??5)),lowStock=products.filter(p=>p.active!==false&&Number(p.stock||0)<=threshold).sort((a,b)=>Number(a.stock||0)-Number(b.stock||0)),posToday=posTodayRes.data||[],onlineToday=onlineTodayRes.data||[];renderMetrics({posTodayCount:posToday.length,posTodayTotal:posToday.reduce((s,x)=>s+Number(x.total||0)-Number(x.returned_total||0),0),onlineTodayCount:onlineToday.length,onlineTodayTotal:onlineToday.reduce((s,x)=>s+Number(x.total||0),0),pendingOrders:Number(pendingRes.count||0),cash:cashRes.data||{open:false},lowStockThreshold:threshold,lowStock,activeProducts:products.filter(p=>p.active!==false).length,totalProducts:products.length});renderLowStock(lowStock);renderActivity(recentPosRes.data||[],recentOrdersRes.data||[]);}
    catch(error){console.error('Error cargando dashboard:',error);const m=document.getElementById('admin-dashboard-metrics'),a=document.getElementById('admin-dashboard-activity'),s=document.getElementById('admin-dashboard-low-stock');if(m)m.innerHTML='<div class="admin-dashboard-empty">No se pudo cargar el resumen. Pulsa Actualizar.</div>';if(a)a.innerHTML='<div class="admin-dashboard-empty">No se pudo cargar la actividad.</div>';if(s)s.innerHTML='<div class="admin-dashboard-empty">No se pudo revisar el inventario.</div>';}
    finally{if(refresh){refresh.disabled=false;refresh.textContent='↻ Actualizar';}}
  }

  document.addEventListener('DOMContentLoaded',async()=>{const dashboard=ensureDashboard();if(!dashboard)return;if(await window.verificarAcceso?.('dashboard')===false)return;applyActionPermissions();document.getElementById('admin-dashboard-refresh')?.addEventListener('click',loadDashboard);await loadDashboard();});
  window.loadAdminDashboard=loadDashboard;
})();
