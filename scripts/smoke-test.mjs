import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const requiredPaths = [
  "apps/web/app/page.tsx",
  "apps/web/app/sitemap.ts",
  "apps/admin/components/crm-workspace.tsx",
  "apps/mobile/app/(tabs)/index.tsx",
  "apps/mobile/app/(tabs)/learning.tsx",
  "apps/mobile/app/(tabs)/practice.tsx",
  "apps/mobile/app/(tabs)/tests.tsx",
  "apps/mobile/app/(tabs)/profile.tsx",
  "apps/api/src/index.ts",
  "infrastructure/firebase/firestore.rules",
  "infrastructure/firebase/storage.rules",
  "packages/shared/src/i18n.ts",
  ".github/workflows/ci.yml"
];

for (const path of requiredPaths) {
  assert.equal(existsSync(path), true, `Missing required project file: ${path}`);
}

const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
assert.deepEqual(rootPackage.workspaces, ["apps/*", "packages/*"], "Root workspaces must include apps and packages");

const i18n = readFileSync("packages/shared/src/i18n.ts", "utf8");
for (const locale of ["uk", "ru", "en"]) {
  assert.equal(i18n.includes(`  ${locale}: {`), true, `Missing ${locale} dictionary`);
}

const ci = readFileSync(".github/workflows/ci.yml", "utf8");
for (const command of ["npm run lint", "npm run typecheck", "npm run test", "npm run build"]) {
  assert.equal(ci.includes(command), true, `CI must run: ${command}`);
}

console.log("Smoke test passed: project structure, i18n dictionaries and CI commands exist.");
