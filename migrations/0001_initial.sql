PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    image TEXT,
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    sizes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sku TEXT,
    barcode TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY,
    store_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo TEXT,
    currency TEXT DEFAULT 'MXN',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_cash_sessions (
    id TEXT PRIMARY KEY,
    folio INTEGER,
    opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    opening_cash REAL NOT NULL DEFAULT 0,
    counted_cash REAL,
    expected_cash REAL NOT NULL DEFAULT 0,
    cash_sales REAL NOT NULL DEFAULT 0,
    card_sales REAL NOT NULL DEFAULT 0,
    transfer_sales REAL NOT NULL DEFAULT 0,
    cash_entries REAL NOT NULL DEFAULT 0,
    cash_expenses REAL NOT NULL DEFAULT 0,
    total_sales REAL NOT NULL DEFAULT 0,
    sales_count INTEGER NOT NULL DEFAULT 0,
    difference REAL,
    close_notes TEXT,
    status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS pos_cash_movements (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    movement_type TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    concept TEXT,
    session_id TEXT,
    FOREIGN KEY (session_id) REFERENCES pos_cash_sessions(id)
);

CREATE TABLE IF NOT EXISTS pos_sales (
    id TEXT PRIMARY KEY,
    folio INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_name TEXT,
    payment_method TEXT NOT NULL,
    amount_received REAL,
    change_due REAL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0,
    discount_type TEXT,
    discount_value REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    returned_total REAL NOT NULL DEFAULT 0,
    notes TEXT,
    items TEXT NOT NULL DEFAULT '[]',
    session_id TEXT,
    FOREIGN KEY (session_id) REFERENCES pos_cash_sessions(id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    movement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    concept TEXT,
    sale_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (sale_id) REFERENCES pos_sales(id)
);

CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    amount REAL NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES pos_sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS staff_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_active
ON products(active);

CREATE INDEX IF NOT EXISTS idx_products_sku
ON products(sku);

CREATE INDEX IF NOT EXISTS idx_products_barcode
ON products(barcode);

CREATE INDEX IF NOT EXISTS idx_sales_created_at
ON pos_sales(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_session
ON pos_sales(session_id);

CREATE INDEX IF NOT EXISTS idx_cash_movements_session
ON pos_cash_movements(session_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product
ON inventory_movements(product_id);
