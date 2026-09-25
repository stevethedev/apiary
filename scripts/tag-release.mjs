#!/usr/bin/env node
// Run as changesets/action's `publish` step: by the time this executes,
// the "Version Packages" PR (produced by `pnpm version`, see
// package.json) has already been merged to main, so package.json's
// version is the new, released one. There's no npm package to publish —
// instead, tag that commit. Pushing the tag triggers
// .github/workflows/release.yml, which builds and uploads the
// cross-platform artifacts.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const tag = `v${pkg.version}`;

const existingTags = run("git tag -l").split("\n");
if (existingTags.includes(tag)) {
  console.log(`Tag ${tag} already exists — nothing to do.`);
  process.exit(0);
}

run('git config user.name "github-actions[bot]"');
run('git config user.email "github-actions[bot]@users.noreply.github.com"');
run(`git tag ${tag}`);
run(`git push origin ${tag}`);

console.log(
  `Tagged and pushed ${tag} — release.yml will build and draft the release.`,
);
