/* URBAN SOCIETY - BACKOFFICE ALERTS */
(function(){
  if(window.__urbanBackofficeAlertsInstalled)return;
  window.__urbanBackofficeAlertsInstalled=true;

  async function refresh(){
    if(typeof Backendless==="undefined")return;

    try{
      const settingsQuery=Backendless.DataQueryBuilder
        .create()
        .setWhereClause("objectId = 'main'")
        .setPageSize(1);

      const productsQuery=Backendless.DataQueryBuilder
        .create()
        .setWhereClause("active = true")
        .setPageSize(1000);

      const [settings,products]=await Promise.all([
        Backendless.Data.of("store_settings").find(settingsQuery),
        Backendless.Data.of("products").find(productsQuery)
      ]);

      const setting=settings?.[0]||null;
      const threshold=Math.max(
        0,
        Number(setting?.low_stock_threshold ?? 5)
      );

      const count=(products||[])
        .filter(p=>Number(p.stock||0)<=threshold)
        .length;

      document.querySelectorAll(
        '[data-bo-badge="low-stock"]'
      ).forEach(b=>{
        b.hidden=count===0;
        b.textContent=count>99?'99+':String(count);
        b.title=count
          ? `${count} producto${count===1?'':'s'} con stock bajo`
          : '';
      });

    }catch(e){
      console.warn(
        'No se pudo revisar stock bajo:',
        e
      );
    }
  }

  document.addEventListener(
    'urban:backoffice-ready',
    refresh
  );

  document.addEventListener(
    'DOMContentLoaded',
    ()=>setTimeout(refresh,350)
  );

  window.refreshUrbanAlerts=refresh;
})();
