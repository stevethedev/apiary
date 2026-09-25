# Changesets

This directory holds [changesets](https://github.com/changesets/changesets) — small markdown files that describe a change worth noting in the changelog, written at the same time as the change itself instead of reconstructed from commit history later.

## Adding a changeset

```sh
pnpm changeset
```

This asks whether the change is a `patch`, `minor`, or `major` bump (apiary is pre-1.0, so in practice `minor` = new feature, `patch` = fix, and `major` is unused until 1.0), then prompts for a short summary. It writes a new file in this directory — commit it alongside your change.

Not every change needs one — skip it for internal refactors, test-only changes, or CI/tooling tweaks that don't affect what a user of the app would notice.

## Releasing (automated)

`.github/workflows/changesets.yml` handles the rest — you shouldn't need to run version/tag commands by hand:

1. Merge PRs with changesets into `main` as normal.
2. The bot opens (and keeps updating) a **"Version Packages" PR** that contains the version bump — `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` together (see `scripts/sync-version.mjs`) — and the `CHANGELOG.md` update. Review it like any other PR.
3. Merging that PR triggers the same workflow to tag the release commit (`scripts/tag-release.mjs`), which in turn triggers `.github/workflows/release.yml` to build macOS/Linux/Windows artifacts and attach them to a **draft** GitHub Release. Publish it manually once you've checked the builds.

## Releasing (manual fallback)

If you need to do it locally instead:

```sh
pnpm version   # changeset version && sync Cargo.toml/tauri.conf.json
git add -A && git commit -m "chore: version packages"
git tag "v$(node -p "require('./package.json').version")"
git push && git push --tags
```
