import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

export const getDbClient = async () => {
  const databaseUrl = Deno.env.get("DATABASE_URL")!;
  const client = new Client(databaseUrl);
  await client.connect();
  return client;
};
