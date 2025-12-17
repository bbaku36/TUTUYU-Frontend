import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDbClient } from "../_shared/db.ts";
import { ensurePinForPhone, normalizePhone, PIN_SECRET } from "../_shared/utils.ts";

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
      const url = new URL(req.url);
      const action = url.pathname.split("/").pop(); // ensure or lookup

      if (req.method === "POST") {
          const body = await req.json();
          const phone = (body.phone || '').toString();
          const normalized = normalizePhone(phone);
          if (!normalized) return new Response(JSON.stringify({ message: "Invalid phone" }), { status: 400, headers: corsHeaders });
          
          let result;
          if (action === "ensure") {
              const exposePin = body.admin === true || req.headers.get('x-admin-pin') === PIN_SECRET;
              result = await ensurePinForPhone(client, normalized, { exposePin });
          } else if (action === "lookup") {
              result = await ensurePinForPhone(client, normalized, { exposePin: true });
              if (!result.pin) throw new Error("Error creating/finding PIN");
          } else {
               return new Response("Not Found", { status: 404, headers: corsHeaders });
          }
          
          return new Response(JSON.stringify({ 
              ...result, 
              phone: normalized 
          }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
      }
      
      return new Response("Not Method Allowed", { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } finally {
      if (client) await client.end();
  }
});
