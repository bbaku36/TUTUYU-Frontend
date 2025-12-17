import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDbClient } from "../_shared/db.ts";
import { toShipment } from "../_shared/utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin, x-admin-bypass-pin",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let client;

  try {
    client = await getDbClient();
    const url = new URL(req.url); // e.g. /payments?shipment_id=123
    // We expect shipment_id in query param or body because routing /shipments/:id/payments is harder to map directly without custom routing logic in one function
    // But let's assume usage of query param `shipment_id` for simplicity in this migration
    
    // GET /payments?shipment_id=123
    if (req.method === "GET") {
        const shipmentId = url.searchParams.get("shipment_id");
        if (!shipmentId) return new Response("Shipment ID required", { status: 400, headers: corsHeaders });
        
        const res = await client.queryObject('SELECT * FROM payments WHERE shipment_id = $1 ORDER BY created_at DESC', [shipmentId]);
        return new Response(JSON.stringify(res.rows), {
             headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // POST /payments
    if (req.method === "POST") {
        const body = await req.json();
        const shipmentId = body.shipment_id || url.searchParams.get("shipment_id");
        if (!shipmentId) return new Response("Shipment ID required", { status: 400, headers: corsHeaders });

        const amount = Number(body.amount) || 0;
        const method = body.method || 'cash';
        if (amount <= 0) return new Response(JSON.stringify({ message: "Amount must be > 0" }), { status: 400, headers: corsHeaders });

        // Fetch shipment
        const shipRes = await client.queryObject('SELECT * FROM shipments WHERE id = $1', [shipmentId]);
        const shipment = shipRes.rows[0];
        if (!shipment) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: corsHeaders });

        // Insert payment
        await client.queryObject('INSERT INTO payments (shipment_id, amount, method) VALUES ($1,$2,$3)', [
          shipmentId, amount, method
        ]);

        // Update shipment
        const paid = (shipment.paid_amount || 0) + amount;
        const balance = (shipment.price || 0) - paid;
        const status = balance <= 0 ? 'paid' : shipment.status;

        await client.queryObject(
          `UPDATE shipments SET paid_amount = $1, balance = $2, status = $3, updated_at = NOW() WHERE id = $4`,
          [paid, balance, status, shipmentId]
        );

        // Fetch updated shipment
        const updatedRes = await client.queryObject('SELECT * FROM shipments WHERE id = $1', [shipmentId]);
        
        // Fetch payments again
        const paymentsRes = await client.queryObject('SELECT * FROM payments WHERE shipment_id = $1 ORDER BY created_at DESC', [shipmentId]);

        return new Response(JSON.stringify({ 
            shipment: toShipment(updatedRes.rows[0]), 
            payments: paymentsRes.rows 
        }), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } finally {
      if (client) await client.end();
  }
});
