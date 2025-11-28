import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('SUPABASE_DB_URL эсвэл DATABASE_URL тохируулаагүй байна.')
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Supabase-ийн self-signed SSL-т тохируулсан
  },
})

export async function initDb() {
  // Суурь хүснэгтүүдийг PostgreSQL дээр үүсгэнэ.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      barcode TEXT NOT NULL,
      phone TEXT,
      customer_name TEXT,
      quantity INTEGER DEFAULT 1,
      weight REAL DEFAULT 0,
      price INTEGER DEFAULT 0,
      paid_amount INTEGER DEFAULT 0,
      balance INTEGER DEFAULT 0,
      status TEXT DEFAULT 'received',
      delivery_status TEXT DEFAULT 'delivery',
      location TEXT DEFAULT 'warehouse',
      arrival_date DATE,
      notes TEXT,
      delivered_at TIMESTAMPTZ,
      delivery_note TEXT,
      courier TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      method TEXT DEFAULT 'cash',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customer_pins (
      phone TEXT PRIMARY KEY,
      pin_hash TEXT NOT NULL,
      pin_plain TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Шинэ талбаруудыг нэмнэ (алдаа гарахаас сэргийлэн IF NOT EXISTS).
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS delivery_note TEXT;
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS courier TEXT;
    ALTER TABLE shipments ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'delivery';

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      payload JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
}
