export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

// ==========================================
    // HEALTH CHECK
    // GET /api/health
// ==========================================
    if (url.pathname === "/api/health") {
  try {
        const result = await env.urbansociety_db
          .prepare("SELECT 1 AS ok")
      .first();

        return Response.json({
        success: true,
          message: "UrbanSociety API funcionando",
          database: result?.ok === 1
        });
  } catch (error) {
    return Response.json(
          {
            success: false,
            error: "Error conectando con D1",
            details: error.message
          },
          { status: 500 }
    );
  }
}

    // ==========================================
    // AUTH - REGISTRO
    // ==========================================
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { name, email, password } = await request.json();
        if (!name || !email || !password) {
          return Response.json({ success: false, error: "Completa todos los campos." }, { status: 400, headers: corsHeaders });
        }

        await env.urbansociety_db.prepare(`CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`).run();

        const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
        const hash = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
        await env.urbansociety_db.prepare(
          "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), name, email.toLowerCase(), hash).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
      }
    }

    // ==========================================
    // AUTH - LOGIN
    // POST /api/auth/login
    // ==========================================
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json();

        if (!email || !password) {
          return Response.json(
            {
              success: false,
              error: "Correo y contraseña son obligatorios."
            },
            { status: 400, headers: corsHeaders }
          );
        }

        const buffer = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(password)
        );

        const hash = Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        const user = await env.urbansociety_db
          .prepare(
            "SELECT id, name, email, role FROM users WHERE email = ? AND password = ?"
          )
          .bind(email.toLowerCase(), hash)
          .first();

        if (!user) {
          return Response.json(
            {
              success: false,
              error: "Correo o contraseña incorrectos."
            },
            { status: 401, headers: corsHeaders }
          );
        }

        return Response.json(
          {
            success: true,
            user,
            token: crypto.randomUUID()
          },
          { headers: corsHeaders }
        );

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error.message
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ==========================================
    // OBTENER PRODUCTOS
    // GET /api/products
    // ==========================================
    if (url.pathname === "/api/products" && request.method === "GET") {
      try {
        const result = await env.urbansociety_db
          .prepare("SELECT * FROM products ORDER BY created_at DESC")
          .all();

        return Response.json(
          {
            success: true,
            products: result.results || []
          },
          { headers: corsHeaders }
        );
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error.message
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }


    // ==========================================
    // CREAR PRODUCTO
    // POST /api/products
    // ==========================================
    if (url.pathname === "/api/products" && request.method === "POST") {
      try {
        const body = await request.json();
        const name = String(body.name || "").trim();
        const price = Number(body.price ?? 0);
        const stock = Number(body.stock ?? 0);
        if (!name) return Response.json({ success: false, error: "El nombre del producto es obligatorio" }, { status: 400, headers: corsHeaders });
        if (!Number.isFinite(price) || price < 0) return Response.json({ success: false, error: "El precio no es válido" }, { status: 400, headers: corsHeaders });
        if (!Number.isInteger(stock) || stock < 0) return Response.json({ success: false, error: "El stock debe ser un número entero mayor o igual a 0" }, { status: 400, headers: corsHeaders });
        return Response.json({ success: true, product: { id: crypto.randomUUID(), name, price, stock } }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
      }
    }

    return Response.json(
      { success: false, error: "Ruta no encontrada." },
      { status: 404, headers: corsHeaders }
    );
  }
};
