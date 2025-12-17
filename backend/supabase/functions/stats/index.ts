import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDbClient } from "../_shared/db.ts";

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
      if (req.method === "GET") {
          const totalsRes = await client.queryObject('SELECT COUNT(*)::int AS count, COALESCE(SUM(price),0)::int AS price, COALESCE(SUM(balance),0)::int AS balance FROM shipments');
          const totals = totalsRes.rows[0];

          const byStatusRes = await client.queryObject('SELECT status, COUNT(*)::int AS count FROM shipments GROUP BY status');
          const byStatus = byStatusRes.rows.reduce((acc: any, row: any) => ({ ...acc, [row.status]: row.count }), {});

          return new Response(JSON.stringify({
            total_shipments: totals.count || 0,
            total_price: Number(totals.price) || 0,
            total_balance: Number(totals.balance) || 0,
            by_status: byStatus,
          }), {
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
