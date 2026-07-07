const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Read and parse .env.local manually to avoid extra dependencies
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found in the root directory.");
  process.exit(1);
}

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

if (!supabaseUrl || !serviceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env.local");
  process.exit(1);
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
  console.log("\nUsage: node scripts/make-admin.js <user_email>");
  console.log("Example: node scripts/make-admin.js admin@zestchat.com\n");
  process.exit(0);
}

// Initialize Supabase with service role key to bypass RLS policies
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log(`Searching profile for: ${email}...`);

  // 1. Get the user profile by email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("Error looking up user profile:", profileError.message);
    process.exit(1);
  }

  if (!profile) {
    console.error(`\nError: No registered profile found with email "${email}".`);
    console.error("Please sign up first in the ZestChat app, then run this command.\n");
    process.exit(1);
  }

  console.log(`Found User: ${profile.full_name} (@${profile.username}) [ID: ${profile.id}]`);
  console.log("Promoting to super_admin...");

  // 2. Insert or update role in admin_users table
  const { error: adminError } = await supabase
    .from("admin_users")
    .upsert({
      user_id: profile.id,
      role: "super_admin",
    }, { onConflict: "user_id" });

  if (adminError) {
    console.error("Failed to promote user:", adminError.message);
    process.exit(1);
  }

  console.log(`\n🎉 Success! User "${email}" is now a super_admin!`);
  console.log("They can now access the admin panel at http://localhost:3000/admin\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
});
