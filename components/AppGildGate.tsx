// AppGild licence gate — Layer 1 access control.
// See middleware.ts and app/layout.tsx for full architecture notes.
// This component injects the AppGild snippet exactly as provided.
// Do not modify the snippet content — it is validated server-side by AppGild.

export default function AppGildGate() {
  const snippet = `
<!-- AppGild access gate — custom for jobwrap. Do not copy to other apps. -->
<div id="appgild-overlay"
     style="position:fixed;top:0;left:0;right:0;bottom:0;
            background:#ffffff;z-index:2147483647;overflow:auto;
            font-family:system-ui,sans-serif">
  <div id="appgild-gate" data-app="jobwrap"
       style="max-width:420px;margin:80px auto;padding:24px;
              border:1px solid #e5e7eb;border-radius:8px">
    <h2 style="margin:0 0 8px;font-size:18px">Enter your license key</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px">
      Get your key from your
      <a href="https://appgild.ai/purchases" target="_blank">AppGild purchases page</a>.
    </p>
    <input id="appgild-key" placeholder="AG-XXXX-XXXX-XXXX-XXXX"
           style="width:100%;padding:8px 12px;font-size:14px;
                  border:1px solid #d1d5db;border-radius:6px;margin-bottom:12px">
    <button id="appgild-verify"
            style="width:100%;padding:10px;background:#4f46e5;color:white;
                   border:0;border-radius:6px;font-size:14px;cursor:pointer">
      Verify access
    </button>
    <p id="appgild-error"
       style="margin:12px 0 0;color:#dc2626;font-size:13px;display:none"></p>
  </div>
</div>
<script>
(function(){
  var SLUG = "jobwrap";
  var HMAC = "02e83433";
  document.getElementById('appgild-verify').onclick = function(){
    var key = document.getElementById('appgild-key').value.trim();
    var err = document.getElementById('appgild-error');
    err.style.display = 'none';
    fetch('https://appgild.ai/api/license/verify', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({license_key: key, app_slug: SLUG, hmac_hint: HMAC})
    }).then(function(r){ return r.json(); })
      .then(function(data){
        if (data.active) {
          document.getElementById('appgild-overlay').style.display = 'none';
          try { localStorage.setItem('appgild-key-'+SLUG, key); } catch(e){}
        } else {
          err.textContent = (data.reason === 'no_active_purchase')
            ? 'That license key has no active purchase for this app.'
            : 'Invalid key — please check your AppGild purchases page.';
          err.style.display = 'block';
        }
      }).catch(function(){
        err.textContent = 'Could not reach AppGild. Try again.';
        err.style.display = 'block';
      });
  };
  function tryCached(){
    try {
      var m = (location.hash || '').match(/appgild-key=([^&]+)/);
      if (m && m[1]) {
        document.getElementById('appgild-key').value = decodeURIComponent(m[1]);
        try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
        document.getElementById('appgild-verify').click();
        return;
      }
    } catch(e){}
    try {
      var saved = localStorage.getItem('appgild-key-'+SLUG);
      if (saved) {
        document.getElementById('appgild-key').value = saved;
        document.getElementById('appgild-verify').click();
      }
    } catch(e){}
  }
  fetch('https://appgild.ai/api/license/verify', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({app_slug: SLUG})
  }).then(function(r){ return r.json(); })
    .then(function(d){
      if (d && d.enforced === false) {
        document.getElementById('appgild-overlay').style.display = 'none';
        return;
      }
      tryCached();
    }).catch(function(){ tryCached(); });
})();
</script>`;

  return (
    <div dangerouslySetInnerHTML={{ __html: snippet }} />
  );
}
