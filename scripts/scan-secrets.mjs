import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", ".tmp", "coverage"]);
const ignoredFiles = new Set(["package-lock.json", "scripts/scan-secrets.mjs"]);
const textExtensions = new Set(["", ".js", ".mjs", ".json", ".jsonl", ".md", ".yml", ".yaml", ".toml", ".example"]);
const rules = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["OpenAI-style secret", /sk-[A-Za-z0-9_-]{20,}/],
  ["Google API key", /AIza[0-9A-Za-z_-]{35}/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["long assigned secret", /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["'][^"'\s]{24,}["']/i],
];

async function walk(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(path)));
    else results.push(path);
  }
  return results;
}

const findings = [];
for (const path of await walk(root)) {
  const name = relative(root, path).replaceAll("\\", "/");
  if (ignoredFiles.has(name) || !textExtensions.has(extname(path))) continue;
  const content = await readFile(path, "utf8");
  for (const [label, pattern] of rules) {
    if (pattern.test(content)) findings.push(`${name}: ${label}`);
  }
}

if (findings.length) {
  console.error("Potential secrets found:\n" + findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("No common credential patterns found in repository text files.");
}

