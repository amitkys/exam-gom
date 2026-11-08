import "dotenv/config";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

const hasReactServerCondition =
  process.execArgv.some((arg) => arg.includes("react-server")) ||
  process.env.__REACT_SERVER_CONDITION === "1";

if (!hasReactServerCondition) {
  const isBun = typeof Bun !== "undefined" || Boolean(process.versions.bun);
  const runtime = isBun ? process.execPath : "node";
  const scriptPath = process.argv[1];
  const args = isBun
    ? ["--conditions=react-server", scriptPath, ...process.argv.slice(2)]
    : ["--conditions=react-server", "--import", "tsx", scriptPath, ...process.argv.slice(2)];

  const child = spawnSync(runtime, args, {
    stdio: "inherit",
    env: { ...process.env, __REACT_SERVER_CONDITION: "1" },
  });

  process.exit(child.status ?? (child.error ? 1 : 0));
}

let dbInstance: typeof import("../db")["db"] | null = null;
let logAuthErrorFn: typeof import("../lib/auth/log")["logAuthError"] | null = null;

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Run this command in an interactive terminal; passwords are entered without echo.");
  }

  const [{ db }, { createFirstSuperadmin }, { firstSuperadminSchema }, { logAuthError }] = await Promise.all([
    import("../db"),
    import("../app/dashboard/users/lib/provision-account"),
    import("../app/dashboard/users/lib/zod-type/account"),
    import("../lib/auth/log"),
  ]);
  dbInstance = db;
  logAuthErrorFn = logAuthError;

  let muted = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    },
  });
  const prompts = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const name = await prompts.question("Admin name: ");
    const email = await prompts.question("Admin email: ");
    process.stdout.write("Password (at least 8 characters, hidden): ");
    muted = true;
    const password = await prompts.question("");
    process.stdout.write("\nConfirm password (hidden): ");
    const confirmation = await prompts.question("");
    muted = false;
    process.stdout.write("\n");
    if (password !== confirmation) throw new Error("Passwords do not match.");
    const parsed = firstSuperadminSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      console.error(parsed.error.issues.map((issue) => issue.message).join("\n"));
      process.exitCode = 1;
      return;
    }
    const result = await createFirstSuperadmin(parsed.data);
    if (!result.success) {
      console.error(result.message);
      process.exitCode = 1;
      return;
    }
    console.log("First superadmin created. Sign in at /login. No invitation email was sent.");
  } finally {
    muted = false;
    prompts.close();
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error && error.name === "AbortError") {
    console.log("\nAdmin setup cancelled.");
    process.exitCode = 130;
    return;
  }
  if (logAuthErrorFn) {
    logAuthErrorFn("createAdmin", error);
  } else {
    console.error(error);
  }
  console.error("Admin setup failed. Check your input, database connection, and schema setup.");
  process.exitCode = 1;
}).finally(async () => {
  if (dbInstance) {
    await dbInstance.$client.end();
  }
});
