import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const result = await pool.query(`
    SELECT p.city, p.description_it, LENGTH(p.description_it) as len
    FROM properties p
    JOIN sources s ON p.source_id = s.id
    WHERE s.name = 'Gesticasa Immobiliare'
    ORDER BY LENGTH(p.description_it) ASC NULLS FIRST
    LIMIT 5
  `);
  
  console.log("Shortest Gesticasa descriptions:\n");
  result.rows.forEach((r, i) => {
    console.log("[" + (i + 1) + "] " + r.city + " (" + (r.len || 0) + " chars):");
    console.log("   " + (r.description_it || "(no description)"));
    console.log();
  });
  
  const stats = await pool.query(`
    SELECT 
      AVG(LENGTH(description_it))::int as avg_len,
      MIN(LENGTH(description_it)) as min_len,
      MAX(LENGTH(description_it)) as max_len,
      COUNT(*) FILTER (WHERE description_it IS NULL) as null_count
    FROM properties p
    JOIN sources s ON p.source_id = s.id
    WHERE s.name = 'Gesticasa Immobiliare'
  `);
  console.log("Statistics:");
  console.log("  Average:", stats.rows[0].avg_len, "chars");
  console.log("  Min:", stats.rows[0].min_len, "chars");
  console.log("  Max:", stats.rows[0].max_len, "chars");
  console.log("  Null descriptions:", stats.rows[0].null_count);
  
  await pool.end();
}
main();
