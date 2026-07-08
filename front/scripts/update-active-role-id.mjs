import { readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";

const files = globSync("src/app/actions/**/*.ts", {
  cwd: "/Users/syd/work/sitak/lesanSatek/front",
});

const authFiles = new Set([
  "auth/login.ts",
  "auth/logout.ts",
  "auth/register.ts",
  "auth/tempUser.ts",
  "auth/getMe.ts",
  "auth/setActiveRole.ts",
]);

let modified = [];

for (const file of files) {
  const relPath = file.replace("src/app/actions/", "");
  if (authFiles.has(relPath)) continue;

  let content = readFileSync(file, "utf-8");
  const original = content;

  content = content.replace(
    'import { getToken } from "@/lib/auth"',
    'import { getToken, getActiveRoleId } from "@/lib/auth"'
  );

  content = content.replace(
    "const token = await getToken();",
    "const token = await getToken();\n    const activeRoleId = await getActiveRoleId();"
  );

  content = content.replace("set: data,", "set: { ...data, activeRoleId },");

  if (content !== original) {
    writeFileSync(file, content);
    modified.push(file);
  }
}

console.log(modified.join("\n"));
console.log(`\nModified ${modified.length} files.`);
