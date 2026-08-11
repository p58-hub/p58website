#!/usr/bin/env node
/* ============================================================
   Project58 — dashboard account generator
   ------------------------------------------------------------
   Builds the values you paste into the Vercel project settings.

     npm run account   add / print an account
     npm run secret    print a SESSION_SECRET

   Passwords are hashed with PBKDF2-HMAC-SHA256 (210k iterations,
   random 16-byte salt). The plaintext password is never stored —
   not in this repo, not in the env var.
   ============================================================ */

import crypto from "node:crypto";
import readline from "node:readline";

const ITER = 210000;
const KEYLEN = 32;
const DIGEST = "sha256";
const ROLES = ["admin", "editor"];

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Same as ask(), but keeps the typed characters off the screen.
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const repaint = (char) => {
      const c = String(char);
      if (c === "\n" || c === "\r" || c === "") return;
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(question);
    };
    process.stdin.on("data", repaint);
    rl.question(question, (answer) => {
      process.stdin.removeListener("data", repaint);
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function hash(password, saltHex) {
  return crypto
    .pbkdf2Sync(password, Buffer.from(saltHex, "hex"), ITER, KEYLEN, DIGEST)
    .toString("hex");
}

async function main() {
  if (process.argv.includes("--secret")) {
    console.log("\nSESSION_SECRET (paste into Vercel, keep it private):\n");
    console.log(crypto.randomBytes(48).toString("base64url"));
    console.log("");
    return;
  }

  console.log("\nProject58 — new dashboard account\n");

  const username = (await ask("Username (for signing in): ")).toLowerCase();
  if (!username) {
    console.error("A username is required.");
    process.exitCode = 1;
    return;
  }

  const name = (await ask("Display name: ")) || username;

  const roleInput = (await ask("Role — admin or editor [editor]: ")).toLowerCase();
  const role = ROLES.includes(roleInput) ? roleInput : "editor";

  const password = await askHidden("Password: ");
  if (password.length < 10) {
    console.error("\nPassword must be at least 10 characters. Nothing was written.");
    process.exitCode = 1;
    return;
  }

  const confirm = await askHidden("Confirm password: ");
  if (password !== confirm) {
    console.error("\nPasswords didn't match. Nothing was written.");
    process.exitCode = 1;
    return;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const entry = {
    u: username,
    name,
    role,
    iter: ITER,
    salt,
    hash: hash(password, salt),
  };

  console.log("\n────────────────────────────────────────────────");
  console.log("Account entry for P58_USERS:\n");
  console.log(JSON.stringify(entry));
  console.log("\nIf P58_USERS is still empty, set it to:\n");
  console.log(JSON.stringify([entry]));
  console.log("\nIf it already has accounts, add the object above inside the existing [ ... ].");
  console.log("────────────────────────────────────────────────\n");
  console.log(
    "Role: " +
      role +
      (role === "admin"
        ? " — full access, including Reset, Import and Site settings."
        : " — content only; Reset, Import and Site settings are hidden.")
  );
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
