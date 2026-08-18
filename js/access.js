/* =========================================================
   URBAN SOCIETY
   BACKOFFICE ACCESS & PERMISSIONS
========================================================= */
(function () {
  if (window.__urbanAccessInstalled) return;
  window.__urbanAccessInstalled = true;

  const OWNER_EMAIL = "mendozaosornio010305@gmail.com";
  const ALL_PERMISSIONS = ["dashboard","pos","products","orders","cash","reports","returns","inventory","customers","settings"];
  const PERMISSION_ROUTES = {dashboard:"admin.html",pos:"pos.html",products:"products.html",orders:"orders.html",cash:"cash.html",reports:"reports.html",returns:"returns.html",inventory:"inventory.html",customers:"customers.html",settings:"settings.html"};
  const PAGE_PERMISSION = {"admin.html":"dashboard","pos.html":"pos","products.html":"products","orders.html":"orders","cash.html":"cash","reports.html":"reports","returns.html":"returns","inventory.html":"inventory","customers.html":"customers","settings.html":"settings"};

  let state={loaded:false,loggedIn:false,owner:false,user:null,staff:null,permissions:{}};
  function normalizedPermissions(raw){const result={};ALL_PERMISSIONS.forEach(key=>{result[key]=Boolean(raw?.all||raw?.[key]);});return result;}

  async function loadAccess(){
    if(!window.urbanSupabase)return state;
    const{data,error}=await window.urbanSupabase.auth.getUser();const user=data?.user||null;
    if(error||!user){state={loaded:true,loggedIn:false,owner:false,user:null,staff:null,permissions:{}};window.urbanAccess=state;return state;}
    const owner=String(user.email||'').trim().toLowerCase()===OWNER_EMAIL;
    if(owner){state={loaded:true,loggedIn:true,owner:true,user,staff:null,permissions:Object.fromEntries(ALL_PERMISSIONS.map(k=>[k,true]))};window.urbanAccess=state;return state;}
    const{data:staff,error:staffError}=await window.urbanSupabase.from('staff_members').select('user_id,email,name,role,permissions,active').eq('user_id',user.id).maybeSingle();if(staffError)console.warn('No se pudo cargar el perfil del empleado:',staffError);const activeStaff=staff&&staff.active!==false?staff:null;
    state={loaded:true,loggedIn:true,owner:false,user,staff:activeStaff,permissions:normalizedPermissions(activeStaff?.permissions||{})};window.urbanAccess=state;return state;
  }
  function can(permission){if(!state.loaded)return false;if(state.owner)return true;return Boolean(state.staff?.active!==false&&state.permissions?.[permission]);}
  function firstAllowedRoute(){for(const key of ALL_PERMISSIONS){if(can(key)&&PERMISSION_ROUTES[key])return PERMISSION_ROUTES[key];}return'UrbanSociety.html';}
  async function verify(permission,options={}){const current=await window.urbanAccessReady;if(!current.loggedIn){const returnTo=encodeURIComponent(location.pathname.split('/').pop()||PERMISSION_ROUTES[permission]||'admin.html');location.replace(`staff-login.html?return=${returnTo}`);return false;}if(current.owner||current.permissions?.[permission])return true;if(!options.silent)alert('Tu cuenta no tiene permiso para entrar a esta sección.');const target=firstAllowedRoute();if(options.redirect!==false&&!location.pathname.toLowerCase().endsWith(target.toLowerCase()))location.replace(target);return false;}
  async function guardCurrentPage(){const page=(location.pathname.split('/').pop()||'').toLowerCase();const current=await window.urbanAccessReady;if(page==='staff.html'){if(!current.loggedIn){location.replace('staff-login.html?return=staff.html');return false;}if(!current.owner){alert('Solo el propietario puede administrar empleados.');location.replace(firstAllowedRoute());return false;}return true;}const permission=PAGE_PERMISSION[page];if(permission)return verify(permission,{silent:true});return true;}

  window.URBAN_ALL_PERMISSIONS=ALL_PERMISSIONS;window.URBAN_PERMISSION_ROUTES=PERMISSION_ROUTES;window.urbanAccess=state;window.urbanAccessReady=loadAccess();window.urbanCan=permission=>can(permission);window.verificarAcceso=verify;window.guardUrbanBackoffice=guardCurrentPage;window.recargarAccesoUrban=async()=>{window.urbanAccessReady=loadAccess();return window.urbanAccessReady;};
  document.addEventListener('DOMContentLoaded',()=>guardCurrentPage());
})();
