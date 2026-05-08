/**
 * Compare the version of the current apps/server/package.json and apps/web/package.json apps/agent/package.json with the version of the last commit
 * If the version is changed, create a tag and push it to the remote repository
 *
 * Usage:
 *   node scripts/tag.mjs
 *   node scripts/tag.mjs --dry-run: only print the command to be executed
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

const dryRun = process.argv.includes("--dry-run");

const exec = (cmd) => {
  if (!dryRun) {
    execSync(cmd, { stdio: "inherit", encoding: "utf-8" });
  } else {
    console.log("Trying to run command: %s", cmd);
  }
};

function getVersion(path) {
  const lastFile = execSync(`git --no-pager show HEAD^1:${path}`, { encoding: "utf-8" });

  const currentFile = readFileSync(path, { encoding: "utf-8" });

  const last = JSON.parse(lastFile).version;

  const current = JSON.parse(currentFile).version;

  return { last, current };
}


let changed = false;

// Tag Release Function
function tagRelease(component, path) {
  const version = getVersion(path);

  if (version.current !== version.last) {
    console.log(`${component} version is changed from %s to %s`, version.last, version.current);
    exec(`git tag -a v${version.current} -m '${component} Release v${version.current}'`);
    return true;
  } else {
    console.log(`${component} version %s is not changed.`, version.current);
    return false;
  }
}

changed |= tagRelease("fund", "package.json");

if (changed) {
  console.log("New Tag Created. Push tags.");
  exec("git push --tags");
}
