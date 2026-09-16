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
    // OBTENER PRODUCTOS
    // GET /api/products
    // ==========================================
    if (url.pathname === "/api/products" && request.method === "GET") {
      try {
        const result = await env.urbansociety_db
          .prepare(`
            SELECT
              id,
              name,
              category,
              image,
              price,
              stock,
              sizes,
              active,
              sku,
              barcode,
              description,
              created_at,
              updated_at
            FROM products
            ORDER BY created_at DESC
          `)
          .all();

        return Response.json({
          success: true,
          products: result.results || []
        }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "No se pudieron obtener los productos",
            details: error.message
          },
          { status: 500 }
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

        if (!name) {
          return Response.json(
            {
              success: false,
              error: "El nombre del producto es obligatorio"
            },
            { status: 400 }
          );
        }

        const price = Number(body.price ?? 0);
        const stock = Number(body.stock ?? 0);

        if (!Number.isFinite(price) || price < 0) {
          return Response.json(
            {
              success: false,
              error: "El precio no es válido"
            },
            { status: 400 }
          );
        }

        if (!Number.isInteger(stock) || stock < 0) {
          return Response.json(
            {
              success: false,
              error: "El stock debe ser un número entero mayor o igual a 0"
            },
            { status: 400 }
          );
        }

        const id = crypto.randomUUID();

        const category = body.category
          ? String(body.category).trim()
          : null;

        const image = body.image
          ? String(body.image).trim()
          : null;

        const sizes = body.sizes
          ? String(body.sizes).trim()
          : null;

        const sku = body.sku
          ? String(body.sku).trim()
          : null;

        const barcode = body.barcode
          ? String(body.barcode).trim()
          : null;

        const description = body.description
          ? String(body.description).trim()
          : null;

        const active = body.active === false ? 0 : 1;

        await env.urbansociety_db
          .prepare(`
            INSERT INTO products (
              id,
              name,
              category,
              image,
              price,
              stock,
              sizes,
              active,
              sku,
              barcode,
              description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            id,
            name,
            category,
            image,
            price,
            stock,
            sizes,
            active,
            sku,
            barcode,
            description
          )
          .run();

        const product = await env.urbansociety_db
          .prepare(`
            SELECT
              id,
              name,
              category,
              image,
              price,
              stock,
              sizes,
              active,
              sku,
              barcode,
              description,
              created_at,
              updated_at
            FROM products
            WHERE id = ?
          `)
          .bind(id)
          .first();

        return Response.json(
          {
            success: true,
            message: "Producto creado correctamente",
            product
          },
          { status: 201 }
        );

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "No se pudo crear el producto",
            details: error.message
          },
          { status: 500 }
        );
      }
    }

    // ==========================================
    // EDITAR PRODUCTO
    // PUT /api/products/:id
    // ==========================================
    if (
      url.pathname.startsWith("/api/products/") &&
      request.method === "PUT"
    ) {
      try {
        const id = url.pathname.split("/").pop();

        if (!id) {
          return Response.json(
            {
              success: false,
              error: "ID de producto no proporcionado"
            },
            { status: 400 }
          );
        }

        const body = await request.json();

        const name = String(body.name || "").trim();

        if (!name) {
          return Response.json(
            {
              success: false,
              error: "El nombre del producto es obligatorio"
            },
            { status: 400 }
          );
        }

        const price = Number(body.price ?? 0);
        const stock = Number(body.stock ?? 0);

        if (!Number.isFinite(price) || price < 0) {
          return Response.json(
            {
              success: false,
              error: "El precio no es válido"
            },
            { status: 400 }
          );
        }

        if (!Number.isInteger(stock) || stock < 0) {
          return Response.json(
            {
              success: false,
              error: "El stock debe ser un número entero mayor o igual a 0"
            },
            { status: 400 }
          );
        }

        const category = body.category
          ? String(body.category).trim()
          : null;

        const image = body.image
          ? String(body.image).trim()
          : null;

        const sizes = body.sizes
          ? String(body.sizes).trim()
          : null;

        const sku = body.sku
          ? String(body.sku).trim()
          : null;

        const barcode = body.barcode
          ? String(body.barcode).trim()
          : null;

        const description = body.description
          ? String(body.description).trim()
          : null;

        const active = body.active === false ? 0 : 1;

        const existing = await env.urbansociety_db
          .prepare("SELECT id FROM products WHERE id = ?")
          .bind(id)
          .first();

        if (!existing) {
          return Response.json(
            {
              success: false,
              error: "Producto no encontrado"
            },
            { status: 404 }
          );
        }

        await env.urbansociety_db
          .prepare(`
            UPDATE products
            SET
              name = ?,
              category = ?,
              image = ?,
              price = ?,
              stock = ?,
              sizes = ?,
              active = ?,
              sku = ?,
              barcode = ?,
              description = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(
            name,
            category,
            image,
            price,
            stock,
            sizes,
            active,
            sku,
            barcode,
            description,
            id
          )
          .run();

        const product = await env.urbansociety_db
          .prepare(`
            SELECT
              id,
              name,
              category,
              image,
              price,
              stock,
              sizes,
              active,
              sku,
              barcode,
              description,
              created_at,
              updated_at
            FROM products
            WHERE id = ?
          `)
          .bind(id)
          .first();

        return Response.json({
          success: true,
          message: "Producto actualizado correctamente",
          product
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "No se pudo actualizar el producto",
            details: error.message
          },
          { status: 500 }
        );
      }
    }

    // ==========================================
    // ELIMINAR PRODUCTO
    // DELETE /api/products/:id
    // ==========================================
    if (
      url.pathname.startsWith("/api/products/") &&
      request.method === "DELETE"
    ) {
      try {
        const id = url.pathname.split("/").pop();

        if (!id) {
          return Response.json(
            {
              success: false,
              error: "ID de producto no proporcionado"
            },
            { status: 400 }
          );
        }

        const existing = await env.urbansociety_db
          .prepare(`
            SELECT id, name
            FROM products
            WHERE id = ?
          `)
          .bind(id)
          .first();

        if (!existing) {
          return Response.json(
            {
              success: false,
              error: "Producto no encontrado"
            },
            { status: 404 }
          );
        }

        await env.urbansociety_db
          .prepare(`
            UPDATE products
            SET
              active = 0,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(id)
          .run();

        return Response.json({
          success: true,
          message: "Producto desactivado correctamente",
          productId: id
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "No se pudo eliminar el producto",
            details: error.message
          },
          { status: 500 }
        );
      }
    }

    // ==========================================
    // RUTA NO ENCONTRADA
    // ==========================================
    return Response.json(
      {
        success: false,
        error: "Ruta no encontrada"
      },
      { status: 404 }
    );
  }
};
