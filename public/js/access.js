/* =========================================================
   URBAN SOCIETY
   BACKOFFICE ACCESS & PERMISSIONS
   BACKENDLESS
========================================================= */

(function () {
  if (window.__urbanAccessInstalled) return;
  window.__urbanAccessInstalled = true;

  const OWNER_USER_ID = "ee3c1047-1655-4ab0-b4eb-6917ad69d4d9";

  const ALL_PERMISSIONS = [
    "dashboard",
    "pos",
    "products",
    "orders",
    "cash",
    "reports",
    "returns",
    "inventory",
    "customers",
    "settings"
  ];

  const PERMISSION_ROUTES = {
    dashboard: "admin.html",
    pos: "pos.html",
    products: "products.html",
    orders: "orders.html",
    cash: "cash.html",
    reports: "reports.html",
    returns: "returns.html",
    inventory: "inventory.html",
    customers: "customers.html",
    settings: "settings.html"
  };

  const PAGE_PERMISSION = {
    "admin.html": "dashboard",
    "pos.html": "pos",
    "products.html": "products",
    "orders.html": "orders",
    "cash.html": "cash",
    "reports.html": "reports",
    "returns.html": "returns",
    "inventory.html": "inventory",
    "customers.html": "customers",
    "settings.html": "settings"
  };

  let state = {
    loaded: false,
    loggedIn: false,
    owner: false,
    user: null,
    staff: null,
    permissions: {}
  };

  function normalizedPermissions(raw) {
    const result = {};

    ALL_PERMISSIONS.forEach(function (key) {
      result[key] = Boolean(raw && (raw.all || raw[key]));
    });

    return result;
  }

  async function loadAccess() {
    try {
      if (typeof iniciarBackendless !== "function") {
        console.error("Urban Society: iniciarBackendless no está disponible.");
        state = {
          loaded: true,
          loggedIn: false,
          owner: false,
          user: null,
          staff: null,
          permissions: {}
        };
        window.urbanAccess = state;
        return state;
      }

      if (!iniciarBackendless()) {
        state = {
          loaded: true,
          loggedIn: false,
          owner: false,
          user: null,
          staff: null,
          permissions: {}
        };
        window.urbanAccess = state;
        return state;
      }

      const user = await Backendless.UserService.getCurrentUser();

      if (!user) {
        state = {
          loaded: true,
          loggedIn: false,
          owner: false,
          user: null,
          staff: null,
          permissions: {}
        };
        window.urbanAccess = state;
        return state;
      }

      const owner =
        String(user.objectId || "").trim() === OWNER_USER_ID;

      if (owner) {
        const permissions = {};

        ALL_PERMISSIONS.forEach(function (key) {
          permissions[key] = true;
        });

        state = {
          loaded: true,
          loggedIn: true,
          owner: true,
          user: user,
          staff: null,
          permissions: permissions
        };

        window.urbanAccess = state;

        console.info("Urban Society: propietario reconocido.");

        return state;
      }

      let staff = null;

      try {
        const query =
          Backendless.DataQueryBuilder
            .create()
            .setWhereClause(
              "user_id = '" +
              String(user.objectId).replace(/'/g, "''") +
              "'"
            )
            .setPageSize(1);

        const result =
          await Backendless.Data.of("staff_members").find(query);

        if (Array.isArray(result) && result.length > 0) {
          staff = result[0];
        }
      } catch (error) {
        console.warn(
          "No se pudo cargar el perfil del empleado:",
          error
        );
      }

      const activeStaff =
        staff && staff.active !== false ? staff : null;

      state = {
        loaded: true,
        loggedIn: true,
        owner: false,
        user: user,
        staff: activeStaff,
        permissions: normalizedPermissions(
          activeStaff ? activeStaff.permissions : {}
        )
      };

      window.urbanAccess = state;

      return state;

    } catch (error) {
      console.error(
        "Urban Society: error cargando permisos:",
        error
      );

      state = {
        loaded: true,
        loggedIn: false,
        owner: false,
        user: null,
        staff: null,
        permissions: {}
      };

      window.urbanAccess = state;

      return state;
    }
  }

  function can(permission) {
    if (!state.loaded) return false;

    if (state.owner) return true;

    return Boolean(
      state.staff &&
      state.staff.active !== false &&
      state.permissions &&
      state.permissions[permission]
    );
  }

  function firstAllowedRoute() {
    for (const key of ALL_PERMISSIONS) {
      if (can(key) && PERMISSION_ROUTES[key]) {
        return PERMISSION_ROUTES[key];
      }
    }

    return "index.html";
  }

  async function verify(permission, options) {
    options = options || {};

    const current = await window.urbanAccessReady;

    if (!current.loggedIn) {
      const returnTo = encodeURIComponent(
        location.pathname.split("/").pop() ||
        PERMISSION_ROUTES[permission] ||
        "admin.html"
      );

      location.replace(
        "staff-login.html?return=" + returnTo
      );

      return false;
    }

    if (
      current.owner ||
      current.permissions[permission]
    ) {
      return true;
    }

    if (!options.silent) {
      alert(
        "Tu cuenta no tiene permiso para entrar a esta sección."
      );
    }

    const target = firstAllowedRoute();

    if (
      options.redirect !== false &&
      !location.pathname
        .toLowerCase()
        .endsWith(target.toLowerCase())
    ) {
      location.replace(target);
    }

    return false;
  }

  async function guardCurrentPage() {
    const page =
      (location.pathname.split("/").pop() || "").toLowerCase();

    const current = await window.urbanAccessReady;

    if (page === "staff.html") {
      if (!current.loggedIn) {
        location.replace(
          "staff-login.html?return=staff.html"
        );
        return false;
      }

      if (!current.owner) {
        alert(
          "Solo el propietario puede administrar empleados."
        );

        location.replace(firstAllowedRoute());

        return false;
      }

      return true;
    }

    const permission = PAGE_PERMISSION[page];

    if (permission) {
      return verify(permission, { silent: true });
    }

    return true;
  }

  window.URBAN_ALL_PERMISSIONS = ALL_PERMISSIONS;
  window.URBAN_PERMISSION_ROUTES = PERMISSION_ROUTES;
  window.urbanAccess = state;

  window.urbanAccessReady = loadAccess();

  window.urbanCan = function (permission) {
    return can(permission);
  };

  window.verificarAcceso = verify;
  window.guardUrbanBackoffice = guardCurrentPage;

  window.recargarAccesoUrban = async function () {
    window.urbanAccessReady = loadAccess();
    return window.urbanAccessReady;
  };

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      guardCurrentPage();
    }
  );

})();
