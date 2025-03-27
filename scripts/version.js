import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

const version = {
  hash: execSync("git rev-parse --short HEAD").toString().trim(),
  name: execSync("git log -1 --oneline")
          .toString()
          .split(" ")
          .slice(1)
          .join(" ")
          .trim(),
};

const outPath = join(process.cwd(), "src", "components", "version.json");
writeFileSync(outPath, JSON.stringify(version, null, 2));
console.log("✅ Generated version file:", version);