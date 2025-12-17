import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDbClient } from "../_shared/db.ts";
import { toShipment, normalizePhone, ensurePinForPhone, verifyPinForPhone, PIN_SECRET } from "../_shared/utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin, x-admin-bypass-pin",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let client;

  try {
    console.log(`[Request] ${req.method} ${req.url}`);
    client = await getDbClient();
    const url = new URL(req.url);
    // Parse ID from path: /shipments or /shipments/123 or /shipments/123/status
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Assuming route mapping puts us at root of function, pathParts might include function name?
    // Supabase routing: /functions/v1/shipments/123 -> ["functions", "v1", "shipments", "123"]
    // Or if local, depend on how it's called.
    // Let's rely on finding "shipments" and looking after it.
    
    // Simplification: We assume the function is deployed as "shipments". 
    // The path usually comes as relative to the function if we use a router, but here we are raw.
    // Let's look at the last segment or 2nd to last.
    
    let id: string | undefined;
    const lastPart = pathParts[pathParts.length - 1];
    const secondLastPart = pathParts[pathParts.length - 2];
    
    // Check for /shipments/:id/status
    const isStatus = lastPart === "status";
    if (isStatus && secondLastPart?.match(/^\d+$/)) {
        id = secondLastPart;
    } else if (lastPart?.match(/^\d+$/)) {
        id = lastPart;
    }

    // --- POST /shipments/batch (Batch Operations) ---
    if (req.method === "POST" && lastPart === "batch") {
        const body = await req.json();
        const { action, ids, updates } = body;
        
        console.log('[BATCH] Action:', action, 'IDs:', ids?.length);

        if (!Array.isArray(ids) || ids.length === 0) {
            return new Response("No IDs provided", { status: 400, headers: corsHeaders });
        }

        if (action === 'delete') {
             await client.queryObject(`DELETE FROM shipments WHERE id = ANY($1)`, [ids]);
             return new Response(JSON.stringify({ success: true, count: ids.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === 'payAll') {
            await client.queryObject(`
                UPDATE shipments 
                SET paid_amount = price, 
                    balance = 0, 
                    status = 'paid',
                    updated_at = NOW()
                WHERE id = ANY($1)
            `, [ids]);
            return new Response(JSON.stringify({ success: true, count: ids.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === 'unpayAll') {
            await client.queryObject(`
                UPDATE shipments 
                SET paid_amount = 0, 
                    balance = price,
                    status = 'pending',
                    location = 'warehouse',
                    delivery_status = '',
                    updated_at = NOW()
                WHERE id = ANY($1)
            `, [ids]);
            return new Response(JSON.stringify({ success: true, count: ids.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === 'archive') {
            await client.queryObject(`
                UPDATE shipments 
                SET status = 'archived',
                    updated_at = NOW()
                WHERE id = ANY($1)
            `, [ids]);
            return new Response(JSON.stringify({ success: true, count: ids.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === 'update' && updates) {
            const fields: string[] = [];
            const values: any[] = [ids]; 
            
            Object.entries(updates).forEach(([key, val]) => {
                if (['status', 'delivery_status', 'location', 'delivery_address', 'delivery_note'].includes(key)) {
                     values.push(val);
                     fields.push(`${key} = $${values.length}`);
                }
            });

            if (fields.length > 0) {
                fields.push(`updated_at = NOW()`);
                 await client.queryObject(`
                    UPDATE shipments 
                    SET ${fields.join(', ')}
                    WHERE id = ANY($1)
                `, values);
            }
            return new Response(JSON.stringify({ success: true, count: ids.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response("Invalid batch action", { status: 400, headers: corsHeaders });
    }

    // --- GET /shipments (List) ---
    if (req.method === "GET" && !id) {
        const phone = url.searchParams.get("phone");
        const barcode = url.searchParams.get("barcode");
        const status = url.searchParams.get("status");
        const location = url.searchParams.get("location");
        const dateFrom = url.searchParams.get("dateFrom");
        const dateTo = url.searchParams.get("dateTo");
        const search = url.searchParams.get("search");
        const page = Number(url.searchParams.get("page")) || 1;
        const limit = Number(url.searchParams.get("limit")) || 20;

        const conditions: string[] = [];
        const values: any[] = [];
        const add = (sql: string, val: any) => {
            values.push(val);
            conditions.push(`${sql} $${values.length}`);
        };
        const addDate = (sql: string, val: any) => {
            values.push(val);
            conditions.push(`${sql} $${values.length}::date`);
        };

        if (phone) add('s.phone ILIKE', `%${phone}%`);
        if (barcode) add('s.barcode ILIKE', `%${barcode}%`);
        if (status) add('s.status =', status);
        if (location) add('s.location =', location);
        if (dateFrom) addDate('s.arrival_date >=', dateFrom);
        if (dateTo) addDate('s.arrival_date <=', dateTo);
        if (search) {
             const start = values.length;
             values.push(`%${search}%`, `%${search}%`, `%${search}%`);
             conditions.push(`(s.phone ILIKE $${start + 1} OR s.barcode ILIKE $${start + 2} OR COALESCE(s.notes,'') ILIKE $${start + 3})`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const limitNum = Math.max(1, Math.min(limit, 200));
        const offset = (page - 1) * limitNum;

        // Count
        const countRes = await client.queryObject(`SELECT COUNT(*)::int AS count FROM shipments s ${where}`, values);
        const total = countRes.rows[0].count;

        // Data
        const query = `
            SELECT s.*, cp.pin_plain
            FROM shipments s
            LEFT JOIN customer_pins cp
              ON regexp_replace(cp.phone, '\\\\D', '', 'g') = regexp_replace(s.phone, '\\\\D', '', 'g')
            ${where}
            ORDER BY s.arrival_date DESC NULLS LAST, s.id DESC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `;
        const dataRes = await client.queryObject(query, [...values, limitNum, offset]);
        const rows = dataRes.rows;

        // Ensure PINs
        // In Edge Functions, we can process serially or parallel.
        for (const row of rows) {
             if (row.pin_plain || !row.phone) continue;
             const { pin } = await ensurePinForPhone(client, row.phone, { exposePin: true });
             if (pin) row.pin_plain = pin;
        }

        return new Response(JSON.stringify({ 
            data: rows.map(toShipment), 
            meta: { page, limit: limitNum, total } 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // --- GET /shipments/:id (Single) ---
    if (req.method === "GET" && id) {
        const query = `
          SELECT s.*, cp.pin_plain
          FROM shipments s
          LEFT JOIN customer_pins cp
            ON right(regexp_replace(cp.phone, '\\D', '', 'g'), 8) = right(regexp_replace(s.phone, '\\D', '', 'g'), 8)
          WHERE s.id = $1
        `;
        const res = await client.queryObject(query, [id]);
        const row = res.rows[0];

        if (!row) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: corsHeaders });

        if (!row.pin_plain && row.phone) {
             const { pin } = await ensurePinForPhone(client, row.phone, { exposePin: true });
             if (pin) row.pin_plain = pin;
        }

        return new Response(JSON.stringify(toShipment(row)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // --- POST /shipments ---
    if (req.method === "POST" && !id) {
        const body = await req.json();
        console.log('[POST] Body:', JSON.stringify(body));
        let {
            barcode, phone = '', customer_name = '', quantity = 1, weight = 0, price = 0, paid_amount = 0,
            status = 'received', delivery_status = '', location = 'warehouse',
            arrival_date = new Date().toISOString().slice(0, 10),
            notes = '', delivery_note = '', courier = '', delivered_at = null
        } = body;

        const locationClean = (location || 'warehouse').toLowerCase();
        const deliveryStatusClean = delivery_status || (locationClean === 'delivery' ? 'delivery' : 'warehouse');

        if (!barcode) return new Response("Barcode required", { status: 400, headers: corsHeaders });

        const cleanPrice = Number(price) || 0;
        const cleanPaid = Number(paid_amount) || 0;
        const cleanQuantity = Number(quantity) || 1;
        const cleanWeight = Number(weight) || 0;
        const balance = cleanPrice - cleanPaid;

        const result = await client.queryObject(
            `INSERT INTO shipments
             (barcode, phone, customer_name, quantity, weight, price, paid_amount, balance, status, delivery_status, location, arrival_date, notes, delivery_note, courier, delivered_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             RETURNING *`,
            [
                barcode.trim(), phone.trim(), customer_name.trim(), cleanQuantity, cleanWeight, cleanPrice, cleanPaid,
                balance, status, deliveryStatusClean, locationClean, arrival_date, notes, delivery_note, courier, delivered_at
            ]
        );
        
        return new Response(JSON.stringify(toShipment(result.rows[0])), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // --- PUT /shipments/:id ---
    if (req.method === "PUT" && id) {
        const body = await req.json();
        console.log('[PUT] Body:', JSON.stringify(body));
        const existingRes = await client.queryObject('SELECT * FROM shipments WHERE id = $1', [id]);
        const existing = existingRes.rows[0];
        if (!existing) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: corsHeaders });

        const merged = { ...existing, ...body };
        const skipPin = body.admin === true || body.adminBypass === true || req.headers.get('x-admin-bypass-pin') === PIN_SECRET;

        merged.quantity = Number(merged.quantity) || 1;
        merged.weight = Number(merged.weight) || 0;
        merged.price = Number(merged.price) || 0;
        merged.paid_amount = Number(merged.paid_amount) || 0;
        merged.balance = merged.price - merged.paid_amount;
        
        const normalizedPhone = normalizePhone(merged.phone || existing.phone || '');
        if (normalizedPhone) merged.phone = normalizedPhone;

        const wantsDelivery = (merged.location || '').toLowerCase() === 'delivery';
        const mergedDeliveryStatus = wantsDelivery ? merged.delivery_status || merged.deliveryStatus || 'delivery' : 'warehouse';
        const phone = normalizedPhone || (merged.phone || existing.phone || '').trim();

        if (wantsDelivery && !skipPin) {
             if (!phone) return new Response(JSON.stringify({ message: "Phone required for delivery" }), { status: 400, headers: corsHeaders });
             
             const pinInput = (body.pin || body.delivery_pin || body.deliveryPin || '').toString().trim();
             const { created } = await ensurePinForPhone(client, phone);
             const pinOk = await verifyPinForPhone(client, phone, pinInput);
             
             if (!pinOk) {
                 const message = created
                  ? '4 оронтой хүргэлтийн PIN үүсгэлээ. 99205050 дугаарт залгаж лавлана уу.'
                  : 'Хүргэлтийн PIN шаардлагатай (буруу байна).';
                 return new Response(JSON.stringify({ 
                     code: 'PIN_REQUIRED', 
                     message, 
                     pinCreated: created 
                 }), { status: 403, headers: corsHeaders });
             }
        } else if (wantsDelivery && skipPin && phone) {
             await ensurePinForPhone(client, phone);
        }

        await client.queryObject(
            `UPDATE shipments SET
             barcode = $1, phone = $2, customer_name = $3, quantity = $4, weight = $5,
             price = $6, paid_amount = $7, balance = $8,
             status = $9, delivery_status = $10, location = $11, arrival_date = $12, notes = $13,
             delivery_note = $14, courier = $15, updated_at = NOW()
             WHERE id = $16`,
            [
                merged.barcode, merged.phone, merged.customer_name, merged.quantity, merged.weight,
                merged.price, merged.paid_amount, merged.balance, merged.status, mergedDeliveryStatus,
                merged.location, merged.arrival_date, merged.notes, merged.delivery_note || null, merged.courier || null,
                id
            ]
        );

        // Fetch updated
        const updatedRes = await client.queryObject('SELECT * FROM shipments WHERE id = $1', [id]);
        return new Response(JSON.stringify(toShipment(updatedRes.rows[0])), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // --- PATCH /shipments/:id/status ---
    if (req.method === "PATCH" && id && isStatus) {
        const body = await req.json();
        console.log('[PATCH] Body:', JSON.stringify(body));
        const existingRes = await client.queryObject('SELECT * FROM shipments WHERE id = $1', [id]);
        const existing = existingRes.rows[0];
        if (!existing) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: corsHeaders });

        const status = body.status || existing.status;
        const location = (body.location || existing.location || 'warehouse').toLowerCase();
        const delivery_status = body.delivery_status || existing.delivery_status || (location === 'delivery' ? 'delivery' : 'warehouse');
        
        let delivered_at = existing.delivered_at;
        if (delivery_status === 'delivered') delivered_at = existing.delivered_at || new Date().toISOString();
        else if (['canceled', 'pending'].includes(delivery_status)) delivered_at = null;

        const paid_amount = status === 'pending' ? 0 : existing.paid_amount || 0;
        const balance = status === 'pending' ? (existing.price || 0) : (existing.balance != null ? existing.balance : 0);

        await client.queryObject(
            `UPDATE shipments
             SET status = $1, delivery_status = $2, location = $3, delivered_at = $4, paid_amount = $5, balance = $6, updated_at = NOW()
             WHERE id = $7`,
            [status, delivery_status, location, delivered_at, paid_amount, balance, id]
        );

        const updatedRes = await client.queryObject('SELECT * FROM shipments WHERE id = $1', [id]);
        return new Response(JSON.stringify(toShipment(updatedRes.rows[0])), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
      if (client) await client.end();
  }
});
