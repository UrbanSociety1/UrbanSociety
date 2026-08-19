/* URBAN SOCIETY - STAFF LOGIN */
(function () {
  if (window.__urbanStaffLoginInstalled) return;
  window.__urbanStaffLoginInstalled = true;

  const OWNER_USER_ID = "ee3c1047-1655-4ab0-b4eb-6917ad69d4d9";
  const $ = id => document.getElementById(id);
  const routeOrder = [
    ["dashboard", "admin.html"],
    ["pos", "pos.html"],
    ["cash", "cash.html"],
    ["products", "products.html"],
    ["orders", "orders.html"],
    ["returns", "returns.html"],
    ["inventory", "inventory.html"],
    ["reports", "reports.html"],
    ["customers", "customers.html"],
    ["settings", "settings.html"]
  ];

  function status(message, isError = false) {
    const element = $("staff-login-status");
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? "#ff8f9b" : "#8fdbaa";
  }

  function safeRequestedRoute(permissions, owner) {
    const requested = new URLSearchParams(location.search).get("return");
    if (!requested || !/^[a-z0-9-]+\.html$/i.test(requested)) return null;
    if (owner) return requested;

    const allowed = new Set(
      routeOrder
        .filter(([permission]) => permissions.all || permissions[permission])
        .map(([, route]) => route)
    );
    return allowed.has(requested) ? requested : null;
  }

  async function routeUser(user) {
    const owner = String(user?.id || "") === OWNER_USER_ID;
    if (owner) {
      location.replace(safeRequestedRoute({}, true) || "admin.html");
      return;
    }

    const { data, error } = await window.urbanSupabase
      .from("staff_members")
      .select("active,permissions")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data || data.active === false) {
      await window.urbanSupabase.auth.signOut();
      throw new Error("Esta cuenta no tiene acceso activo al sistema.");
    }

    const permissions = data.permissions || {};
    const target = routeOrder.find(([permission]) =>
      permissions.all || permissions[permission]
    );

    if (!target) {
      await window.urbanSupabase.auth.signOut();
      throw new Error("Tu cuenta no tiene módulos habilitados.");
    }

    location.replace(safeRequestedRoute(permissions, false) || target[1]);
  }

  async function submit(event) {
    event.preventDefault();
    const button = $("staff-login-submit");
    button.disabled = true;
    button.textContent = "ENTRANDO...";
    status("Validando acceso...");

    try {
      const { data, error } = await window.urbanSupabase.auth.signInWithPassword({
        email: $("staff-login-email").value.trim(),
        password: $("staff-login-password").value
      });
      if (error) throw error;
      await routeUser(data.user);
    } catch (error) {
      status(error.message || "No se pudo iniciar sesión.", true);
      button.disabled = false;
      button.textContent = "ENTRAR AL SISTEMA";
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("staff-login-form")?.addEventListener("submit", submit);
    const { data } = await window.urbanSupabase.auth.getUser();
    if (data?.user) {
      try { await routeUser(data.user); } catch (_) {}
    }
  });
})();
