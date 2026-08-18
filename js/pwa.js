/* URBAN SOCIETY - PWA */
(function(){
  if(window.__urbanPwaInstalled)return;
  window.__urbanPwaInstalled=true;
  let deferredPrompt=null;
  const manifest=document.querySelector('link[rel="manifest"]')||document.createElement('link');
  manifest.rel='manifest';manifest.href='manifest.webmanifest';if(!manifest.parentNode)document.head.appendChild(manifest);
  function installButton(){
    const page=(location.pathname.split('/').pop()||'').toLowerCase();
    if(!['urbansociety.html','account.html'].includes(page)||document.getElementById('urban-install-app'))return null;
    const b=document.createElement('button');b.id='urban-install-app';b.type='button';b.textContent='⬇ Instalar app';
    Object.assign(b.style,{position:'fixed',left:'16px',bottom:'16px',zIndex:'6500',display:'none',padding:'10px 13px',border:'1px solid #393941',borderRadius:'999px',background:'#111116',color:'#fff',fontWeight:'800',boxShadow:'0 12px 35px rgba(0,0,0,.35)'});
    b.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;b.style.display='none';});
    document.body.appendChild(b);return b;
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;const b=installButton()||document.getElementById('urban-install-app');if(b)b.style.display='block';});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;document.getElementById('urban-install-app')?.remove();});
  document.addEventListener('DOMContentLoaded',installButton);
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('PWA no disponible:',err)));
  }
})();
