import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../src", import.meta.url));

function collectFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const filePath = join(dir, name);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      return collectFiles(filePath);
    }

    return name.endsWith(".js") ? [filePath] : [];
  });
}

const files = collectFiles(root);
const failures = files
  .map((file) => {
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8"
    });

    if (result.status !== 0) {
      process.stderr.write(result.stderr);
      return file;
    }

    return null;
  })
  .filter(Boolean);

if (failures.length) {
  process.exit(1);
}

console.log(`Syntax OK: ${files.length} server files checked`);
