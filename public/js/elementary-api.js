```javascript
// ==========================================
// URBANSOCIETY
// ELEMENTARY POS API
// ==========================================

class ElementaryAPI {

    constructor() {

        this.config = URBAN_CONFIG.ELEMENTARY;

        this.baseURL = this.config.PROXY_ENABLED
            ? this.config.PROXY_URL
            : this.config.API_URL;
    }


    // ==========================================
    // PETICIÓN GENERAL
    // ==========================================

    async request(endpoint, options = {}) {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, this.config.TIMEOUT);


        try {

            const response = await fetch(
                this.baseURL + endpoint,
                {
                    ...options,

                    signal: controller.signal,

                    headers: {
                        "Content-Type": "application/json",

                        ...(options.headers || {})
                    }
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Error API Elementary POS: HTTP " +
                    response.status
                );
            }


            return await response.json();

        }

        catch (error) {

            console.error(
                "Elementary POS:",
                error
            );

            throw error;

        }

        finally {

            clearTimeout(timeout);

        }
    }


    // ==========================================
    // PRODUCTOS
    // ==========================================

    async obtenerProductos() {

        return await this.request(
            "/products"
        );
    }


    // ==========================================
    // CATEGORÍAS
    // ==========================================

    async obtenerCategorias() {

        return await this.request(
            "/categories"
        );
    }


    // ==========================================
    // PEDIDOS
    // ==========================================

    async obtenerPedidos() {

        return await this.request(
            "/orders"
        );
    }


    // ==========================================
    // BUSCAR PRODUCTOS
    // ==========================================

    async buscarProductos(texto) {

        const productos =
            await this.obtenerProductos();


        const lista =
            Array.isArray(productos)
                ? productos
                : (
                    productos.data ||
                    productos.products ||
                    []
                );


        const busqueda =
            texto
                .toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );


        return lista.filter(producto => {

            const nombre =
                String(
                    producto.name ||
                    producto.nombre ||
                    producto.title ||
                    ""
                )
                .toLowerCase();


            return nombre.includes(busqueda);

        });

    }

}


// ==========================================
// INSTANCIA GLOBAL
// ==========================================

const elementaryAPI =
    new ElementaryAPI();
```
