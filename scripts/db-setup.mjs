import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function setup() {
  // Enable RLS
  await sql.unsafe("ALTER TABLE rooms ENABLE ROW LEVEL SECURITY");
  await sql.unsafe("ALTER TABLE moods ENABLE ROW LEVEL SECURITY");
  await sql.unsafe("ALTER TABLE messages ENABLE ROW LEVEL SECURITY");
  console.log("✓ RLS enabled");

  // Policies
  const tables = ["rooms", "moods", "messages"];
  for (const table of tables) {
    try {
      await sql.unsafe(
        `CREATE POLICY "allow_all_${table}" ON ${table} FOR ALL USING (true) WITH CHECK (true)`
      );
    } catch (e) {
      if (!e.message.includes("already exists")) throw e;
      console.log(`  Policy for ${table} already exists, skipping`);
    }
  }
  console.log("✓ RLS policies created");

  // Enable realtime
  for (const table of tables) {
    try {
      await sql.unsafe(
        `ALTER PUBLICATION supabase_realtime ADD TABLE ${table}`
      );
    } catch (e) {
      if (!e.message.includes("already member")) throw e;
      console.log(`  ${table} already in realtime publication, skipping`);
    }
  }
  console.log("✓ Realtime enabled");

  await sql.end();
  console.log("✓ Done!");
}

setup().catch((e) => {
  console.error("Setup failed:", e.message);
  process.exit(1);
});
