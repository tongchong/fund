
/**
 * Execute pnpm changeset version to bump package versions, and bump root package.json version
 */

import { execSync } from "child_process";
import fm from "front-matter";
import fs, { existsSync } from "fs";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const exec = (cmd) => execSync(cmd, { stdio: "inherit" });

/**
 * 1. Aggregate current changes by reading changeset files
 */
const CHANGESET_DIR = ".changeset";

const files = await readdir(CHANGESET_DIR);

const changes = {
  "web": [],
};

for (const file of files) {
  if (!file.endsWith(".md") || file === "README.md") { continue; }
  const changesetFilePath = join(CHANGESET_DIR, file);

  const gitCommit = execSync(`git log -n 1 --pretty=format:%H -- ${changesetFilePath}`, {
    encoding: "utf-8",
  });

  const fileContent = await readFile(changesetFilePath, "utf8");
  const content = fm(fileContent);

  for (const [tinyGarlicRagPackage, type] of Object.entries(content.attributes)) {
    const part = tinyGarlicRagPackage.substring("@fund/".length);
    if (part in changes) {
      changes[part].push({ type, content: content.body.trim(), gitCommit });
    }
  }
}

/**
 * 2. Run changeset version to update versions of packages
 */
console.log("Run changeset version to bump package versions");
exec("pnpm changeset version");

/**
 * 3. Update root package version
 */
console.log("Update root package version");
const readPackageJson = (path) => JSON.parse(fs.readFileSync(path, { encoding: "utf8" }));
const rootPackageJson = readPackageJson("./package.json");

// read version from a app package
const webPackageJson = readPackageJson("./apps/web/package.json");

console.log("Web version is %s. Root version is %s", webPackageJson.version, rootPackageJson.version);

if (webPackageJson.version === rootPackageJson.version) {
  console.log("Web Version is not changed. Ignored.");
  process.exit(0);
}

console.log("Web Version is changed. Update root package.json version");
rootPackageJson.version = webPackageJson.version;
await writeFile("./package.json", JSON.stringify(rootPackageJson, null, 2));

/**
 * 4. Generate changelog
 */
console.log("Generate changelog for version %s", rootPackageJson.version);

const getChangesetLine = (line) =>
  `- ${line.content}` +
  ` ([${line.gitCommit.substring(0, 8)}](https://github.com/PKUHPC/fund/commit/${line.gitCommit}))`;


console.log("changes", changes);

/**
 * Generate changelog content for a package
 * @param {string} tinyGarlicRagPackage the package name
 * @param {string | undefined} title title. if not set, no title is shown
 * @returns changelog content
 */
const generateContent = (tinyGarlicRagPackage, title) => {
  console.log("tinyGarlicRagPackage", tinyGarlicRagPackage);
  console.log("title", title);
  const packageChanges = changes[tinyGarlicRagPackage];

  if (packageChanges.length === 0) { return ""; }

  // categories changes by type

  const changesByType = { "patch": [], "minor": [], "major":[]};

  for (const change of packageChanges) {
    changesByType[change.type].push(change);
  }

  let content = title ? `## ${title} (${tinyGarlicRagPackage}) \n\n` : "";
  if (changesByType.major.length > 0) {
    content += "### 重大更新\n" + changesByType.major.map(getChangesetLine).join("\n") + "\n\n";
  }

  if (changesByType.minor.length > 0) {
    content += "### 重要更新\n" + changesByType.minor.map(getChangesetLine).join("\n") + "\n\n";
  }

  if (changesByType.patch.length > 0) {
    content += "### 小型更新\n" + changesByType.patch.map(getChangesetLine).join("\n") + "\n\n";
  }

  return content.trim() + "\n\n";
};


const changelogContent = `# v${rootPackageJson.version}

发布于：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}

${generateContent("web", "业务系统")
}
`;

const CHANGELOG_BASE_PATH = "changelogs";

if (!existsSync(CHANGELOG_BASE_PATH)) {
  await mkdir(CHANGELOG_BASE_PATH);
}

const CHANGELOG_PATH = join(CHANGELOG_BASE_PATH, `v${rootPackageJson.version}.md`);
await writeFile(CHANGELOG_PATH, changelogContent);

console.log("Generated changelog at %s", CHANGELOG_PATH);
console.debug("Changelog content:\n%s", changelogContent);

