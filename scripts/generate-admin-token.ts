#!/usr/bin/env npx tsx

/**
 * Generate Admin Token Script
 *
 * Generates and sets an admin token for a source.
 *
 * Usage:
 *   npx tsx scripts/generate-admin-token.ts "Source Name"
 *   npx tsx scripts/generate-admin-token.ts --list
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { query, queryAll, queryOne, closePool } from "../db/connection";
import crypto from "crypto";

async function listSources() {
  const sources = await queryAll<{ id: string; name: string; admin_token: string | null }>(
    `SELECT id, name, admin_token FROM sources ORDER BY name`
  );

  console.log("\nSources:");
  console.log("-".repeat(60));

  for (const source of sources) {
    const status = source.admin_token ? "Has token" : "No token";
    console.log(`  ${source.name}: ${status}`);
    if (source.admin_token) {
      console.log(`    URL: /admin/${source.admin_token}`);
    }
  }

  console.log("");
}

async function generateToken(sourceName: string) {
  // Find the source
  const source = await queryOne<{ id: string; name: string; admin_token: string | null }>(
    `SELECT id, name, admin_token FROM sources WHERE name ILIKE $1`,
    [sourceName]
  );

  if (!source) {
    console.error(`Error: Source "${sourceName}" not found.`);
    console.log("\nAvailable sources:");
    await listSources();
    return;
  }

  // Generate new token
  const token = crypto.randomBytes(24).toString("hex");

  // Update the source
  await query(`UPDATE sources SET admin_token = $1 WHERE id = $2`, [token, source.id]);

  console.log(`\nAdmin token generated for: ${source.name}`);
  console.log("-".repeat(60));
  console.log(`Token: ${token}`);
  console.log(`Admin URL: /admin/${token}`);
  console.log("");

  if (source.admin_token) {
    console.log("Note: Previous token has been replaced.");
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Usage:
  npx tsx scripts/generate-admin-token.ts "Source Name"
  npx tsx scripts/generate-admin-token.ts --list

Examples:
  npx tsx scripts/generate-admin-token.ts "Casa a Mola"
  npx tsx scripts/generate-admin-token.ts --list
`);
    await closePool();
    return;
  }

  try {
    if (args[0] === "--list") {
      await listSources();
    } else {
      const sourceName = args.join(" ");
      await generateToken(sourceName);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await closePool();
  }
}

main();
