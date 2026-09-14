/* URBAN SOCIETY - BACKOFFICE ALERTS */
(function(){
  if(window.__urbanBackofficeAlertsInstalled)return;
  window.__urbanBackofficeAlertsInstalled=true;
  async function refresh(){
    if(!window.urbanSupabase)return;
    try{
      const [{data:settings},{data:products,error}]=await Promise.all([
        window.urbanSupabase.from('store_settings').select('low_stock_threshold').eq('id','main').maybeSingle(),
        window.urbanSupabase.from('products').select('id,stock,active').eq('active',true)
      ]);
      if(error)return;
      const threshold=Math.max(0,Number(settings?.low_stock_threshold??5));
      const count=(products||[]).filter(p=>Number(p.stock||0)<=threshold).length;
      document.querySelectorAll('[data-bo-badge="low-stock"]').forEach(b=>{
        b.hidden=count===0;
        b.textContent=count>99?'99+':String(count);
        b.title=count?`${count} producto${count===1?'':'s'} con stock bajo`:'';
      });
    }catch(e){console.warn('No se pudo revisar stock bajo:',e);}
  }
  document.addEventListener('urban:backoffice-ready',refresh);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,350));
  window.refreshUrbanAlerts=refresh;
})();
