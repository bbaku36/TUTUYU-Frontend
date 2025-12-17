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
          const res = await client.queryObject("SELECT payload FROM site_content WHERE key = 'sections'");
          const row = res.rows[0];
          // payload is JSONB, deno-postgres auto parses it? Yes usually.
          // But strict generic type might require check.
          const payload = row?.payload;
          const sections = payload || [];
          return new Response(JSON.stringify({ sections }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
      }

      if (req.method === "PUT") {
          const body = await req.json();
          const sections = Array.isArray(body.sections) ? body.sections : [];
          const payload = JSON.stringify(sections);
          
          await client.queryObject(
              `INSERT INTO site_content(key, payload, updated_at)
               VALUES ('sections', $1::jsonb, NOW())
               ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
               [payload]
          );
          
          return new Response(JSON.stringify({ sections }), {
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
