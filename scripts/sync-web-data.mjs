import { copyFile, cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDataDir = join(repoRoot, "data");
const webDataDir = join(repoRoot, "apps/web/src/data");

await mkdir(webDataDir, { recursive: true });
await cp(sourceDataDir, webDataDir, {
  recursive: true,
  force: true,
  filter: (source) => !source.endsWith(".DS_Store")
});

await copyFile(
  join(webDataDir, "geo/beijing-districts.simplified.geojson"),
  join(webDataDir, "geo/beijing-districts.simplified.json")
);

await copyFile(
  join(webDataDir, "geo/beijing-datav-110000_full.json"),
  join(webDataDir, "geo/beijing-datav-110000_full.web.json")
);

console.log(`Synced data -> ${webDataDir}`);
