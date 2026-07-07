const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const config = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const parts = trimmed.split("=");
    const key = parts[0].trim();
    const value = parts.slice(1).join("=").trim().replace(/['"]/g, "");
    config[key] = value;
  }
});

const supabaseUrl = config.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = config.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function test() {
  console.log("Listing tables in public schema...");
  const { data, error } = await adminClient.rpc("get_tables"); // Let's check if we can query directly
  if (error) {
    console.log("RPC get_tables not found, querying tables via standard query...");
    const { data: tables, error: tablesErr } = await adminClient
      .from("profiles")
      .select("id")
      .limit(1);
    console.log("Profiles test:", tables, tablesErr);
    
    // Let's do a select from pg_catalog or information_schema if possible via postgrest, but Postgrest doesn't expose pg_catalog by default.
    // Let's see if we can do something else, like query another table.
    const tablesToTry = [
      "profiles",
      "admin_users",
      "platform_settings",
      "user_bans",
      "user_restrictions",
      "warnings",
      "reports",
      "ban_appeals",
      "appeals",
      "audit_logs"
    ];
    for (const t of tablesToTry) {
      const { data: rows, error: err } = await adminClient.from(t).select("*").limit(1);
      console.log(`Table ${t}: exists = ${!err}, rows = ${rows ? rows.length : 0}, error = ${err ? err.message : 'none'}`);
    }
  } else {
    console.log("Tables:", data);
  }
}

test();
