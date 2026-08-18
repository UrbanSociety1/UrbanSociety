/* =========================================================
   URBAN SOCIETY
   SUPABASE BACKEND
   Capa de compatibilidad para mantener el resto de la tienda simple.
========================================================= */

(function () {
  if (window.__urbanSupabaseBackendInstalled) return;
  window.__urbanSupabaseBackendInstalled = true;

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase JS no está cargado.");
    return;
  }

  if (typeof SUPABASE_CONFIG === "undefined") {
    console.error("SUPABASE_CONFIG no está definido.");
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_CONFIG.URL,
    SUPABASE_CONFIG.PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  window.urbanSupabase = client;

  function fechaMs(value) {
    if (!value) return null;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : null;
  }

  function usuarioLegacy(user) {
    if (!user) return null;
    return {
      objectId: user.id,
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.user_metadata?.full_name || "",
      phone: user.user_metadata?.phone || user.phone || ""
    };
  }

  function productoLegacy(row) {
    if (!row) return row;
    return {
      objectId: row.id,
      id: row.id,
      created: fechaMs(row.created_at),
      updated: fechaMs(row.updated_at),
      name: row.name,
      category: row.category,
      description: row.description,
      image: row.image,
      imageUrl: row.image,
      price: Number(row.price || 0),
      stock: Number(row.stock || 0)
    };
  }

  function pedidoLegacy(row) {
    if (!row) return row;
    return {
      objectId: row.id,
      id: row.id,
      created: fechaMs(row.created_at),
      updated: fechaMs(row.updated_at),
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      address: row.address,
      paymentMethod: row.payment_method,
      products: row.products,
      total: Number(row.total || 0),
      status: row.status,
      userId: row.user_id
    };
  }

  function nombreTabla(tableName) {
    const name = String(tableName || "").toLowerCase();
    if (name === "products") return "products";
    if (name === "orders" || name === "pedidos") return "orders";
    return tableName;
  }

  function aLegacy(table, row) {
    if (table === "products") return productoLegacy(row);
    if (table === "orders") return pedidoLegacy(row);
    return row;
  }

  function aDb(table, value) {
    const data = value || {};

    if (table === "products") {
      return {
        name: data.name,
        category: data.category || "General",
        description: data.description || "",
        image: data.image || data.imageUrl || "",
        price: Number(data.price || 0),
        stock: Number(data.stock || 0)
      };
    }

    if (table === "orders") {
      const result = {};
      if (data.customerName !== undefined) result.customer_name = data.customerName;
      if (data.customerEmail !== undefined) result.customer_email = data.customerEmail;
      if (data.customerPhone !== undefined) result.customer_phone = data.customerPhone;
      if (data.address !== undefined) result.address = data.address;
      if (data.paymentMethod !== undefined) result.payment_method = data.paymentMethod;
      if (data.products !== undefined) {
        result.products = Array.isArray(data.products)
          ? data.products
          : JSON.parse(data.products || "[]");
      }
      if (data.total !== undefined) result.total = Number(data.total || 0);
      if (data.status !== undefined) result.status = data.status;
      if (data.userId !== undefined) result.user_id = data.userId || null;
      return result;
    }

    return { ...data };
  }

  function mapSortField(field) {
    const clean = String(field || "").trim();
    const [raw, direction] = clean.split(/\s+/);
    const map = {
      created: "created_at",
      updated: "updated_at",
      objectId: "id",
      userId: "user_id"
    };
    return {
      column: map[raw] || raw,
      ascending: String(direction || "ASC").toUpperCase() !== "DESC"
    };
  }

  class UrbanQueryBuilder {
    constructor() {
      this.sortBy = [];
      this.pageSize = null;
      this.whereClause = "";
    }
    setSortBy(value) {
      this.sortBy = Array.isArray(value) ? value : [value];
      return this;
    }
    setPageSize(value) {
      this.pageSize = Number(value || 0) || null;
      return this;
    }
    setWhereClause(value) {
      this.whereClause = String(value || "");
      return this;
    }
  }

  function storeFor(tableName) {
    const table = nombreTabla(tableName);

    return {
      async find(queryBuilder) {
        let query = client.from(table).select("*");
        const qb = queryBuilder || {};

        const where = String(qb.whereClause || "");
        const match = where.match(/^\s*(userId|objectId)\s*=\s*'([^']*)'\s*$/i);
        if (match) {
          const column = match[1].toLowerCase() === "userid" ? "user_id" : "id";
          query = query.eq(column, match[2]);
        }

        for (const sort of qb.sortBy || []) {
          const parsed = mapSortField(sort);
          query = query.order(parsed.column, { ascending: parsed.ascending });
        }

        if (qb.pageSize) query = query.limit(qb.pageSize);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(row => aLegacy(table, row));
      },

      async findById(id) {
        const { data, error } = await client
          .from(table)
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        return aLegacy(table, data);
      },

      async save(value) {
        const objectId = value?.objectId || value?.id || null;
        const body = aDb(table, value);

        if (objectId) {
          const { data, error } = await client
            .from(table)
            .update(body)
            .eq("id", objectId)
            .select("*")
            .single();
          if (error) throw error;
          return aLegacy(table, data);
        }

        const { data, error } = await client
          .from(table)
          .insert(body)
          .select("*")
          .single();
        if (error) throw error;
        return aLegacy(table, data);
      },

      async remove(idOrObject) {
        const id = typeof idOrObject === "string"
          ? idOrObject
          : idOrObject?.objectId || idOrObject?.id;
        const { error } = await client.from(table).delete().eq("id", id);
        if (error) throw error;
        return true;
      }
    };
  }

  function BackendlessUser() {}

  const BackendlessCompat = {
    initApp() {
      return true;
    },

    User: BackendlessUser,

    DataQueryBuilder: {
      create() {
        return new UrbanQueryBuilder();
      }
    },

    Data: {
      of(tableName) {
        return storeFor(tableName);
      }
    },

    UserService: {
      async register(user) {
        const { data, error } = await client.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name || ""
            }
          }
        });
        if (error) throw error;
        const result = usuarioLegacy(data.user);
        if (result) result.sessionCreated = Boolean(data.session);
        return result;
      },

      async login(email, password) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return usuarioLegacy(data.user);
      },

      async logout() {
        const { error } = await client.auth.signOut();
        if (error) throw error;
        return true;
      },

      async getCurrentUser() {
        const { data, error } = await client.auth.getUser();
        if (error) {
          if (/session/i.test(error.message || "")) return null;
          throw error;
        }
        return usuarioLegacy(data.user);
      },

      async getCurrentUserToken() {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data.session?.access_token || null;
      }
    },

    Files: {
      async upload(file, path, overwrite) {
        const cleanPath = String(path || "")
          .replace(/^\/+/, "")
          .replace(/^products\//i, "");

        const { error } = await client.storage
          .from("products")
          .upload(cleanPath, file, {
            upsert: Boolean(overwrite),
            cacheControl: "3600"
          });
        if (error) throw error;

        const { data } = client.storage
          .from("products")
          .getPublicUrl(cleanPath);

        return {
          fileURL: data.publicUrl,
          url: data.publicUrl
        };
      }
    }
  };

  window.Backendless = BackendlessCompat;
  window.urbanToLegacyProduct = productoLegacy;
  window.urbanToLegacyOrder = pedidoLegacy;

  console.info("Urban Society conectado a Supabase.");
})();
