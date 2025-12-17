import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { getDbClient } from "./db.ts";

export const PIN_SECRET = Deno.env.get("PIN_SECRET") || "tutuyu-pin-secret";

export const normalizePhone = (phone: string | null | undefined) => (phone || '').replace(/\D+/g, '');

export const normalizePhoneWithShort = (phone: string) => {
  const normalized = normalizePhone(phone);
  const short = normalized ? normalized.slice(-8) : '';
  return { normalized, short };
};

export const hashPin = (phone: string, pin: string) => 
  createHash('sha256').update(`${PIN_SECRET}:${phone}:${pin}`).digest('hex');

export const ensurePinForPhone = async (client: any, phone: string, { exposePin = false } = {}) => {
  const { normalized, short } = normalizePhoneWithShort(phone);
  if (!normalized) return { created: false };

  // Note: deno-postgres query arguments are indexed $1, $2...
  const existing = await client.queryObject(
    "SELECT phone, pin_hash, pin_plain FROM customer_pins WHERE right(regexp_replace(phone, '\\\\D', '', 'g'), 8) = $1",
    [short]
  );
  const picked = existing.rows[0];

  if (picked) {
    if (picked.pin_plain) return { created: false, pin: exposePin ? picked.pin_plain : undefined };
    
    // Regenerate if missing plain pin (legacy logic)
    const regen = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const regenHash = hashPin(normalizePhone(picked.phone), regen);
    
    await client.queryObject('UPDATE customer_pins SET pin_hash = $1, pin_plain = $2 WHERE phone = $3', [
      regenHash,
      regen,
      normalizePhone(picked.phone),
    ]);
    return { created: true, pin: exposePin ? regen : undefined };
  }

  const pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const pinHash = hashPin(normalized, pin);
  
  // Upsert
  const { rows } = await client.queryObject(
    'INSERT INTO customer_pins (phone, pin_hash, pin_plain) VALUES ($1,$2,$3) ON CONFLICT (phone) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, pin_plain = EXCLUDED.pin_plain RETURNING pin_plain',
    [normalized, pinHash, pin]
  );
  return { created: true, pin: exposePin ? rows[0]?.pin_plain || pin : undefined };
};

export const verifyPinForPhone = async (client: any, phone: string, pin: string) => {
  const { normalized, short } = normalizePhoneWithShort(phone);
  const pinString = (pin || '').toString().replace(/\D+/g, '');
  if (!normalized || !pinString) return false;

  const res = await client.queryObject(
    "SELECT phone, pin_hash, pin_plain FROM customer_pins WHERE right(regexp_replace(phone, '\\\\D', '', 'g'), 8) = $1 LIMIT 1",
    [short]
  );
  const row = res.rows[0];
  if (!row) return false;

  const normalizedPhone = normalizePhone(row.phone);
  
  // Verify match: plain text or hash
  if ((row.pin_plain || '').toString().trim() === pinString) return true;
  return hashPin(normalizedPhone, pinString) === row.pin_hash;
};

export const toShipment = (row: any) =>
  row && {
    ...row,
    quantity: Number(row.quantity) || 0,
    weight: Number(row.weight) || 0,
    price: Number(row.price) || 0,
    paid_amount: Number(row.paid_amount) || 0,
    balance: Number(row.balance) || 0,
  };
