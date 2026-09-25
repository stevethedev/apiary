import js from "@eslint/js";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";
import { defineConfig } from "eslint/config";
import { cwd } from "node:process";

// Ensure plugin configs are arrays so they can be spread into the top-level array
const ensureArray = (cfg) => (Array.isArray(cfg) ? cfg : cfg ? [cfg] : []);

export default defineConfig([
  {
    ...js.configs.recommended,
    files: ["**/*.{mjs,cjs,js,jsx}"],
    // These files (config files, Node scripts) run under Node, not the
    // browser — without this, `no-undef` flags Node globals like
    // `console`/`process` as undefined.
    languageOptions: {
      globals: globals.node,
    },
  },
  ...ensureArray(tseslint.configs.strict).map((c) => ({
    ...c,
    // tseslint.configs.strict is an array of sub-objects, some of which have
    // no `files` restriction of their own and would otherwise apply
    // globally to every file ESLint touches, including non-TS files.
    files: c.files ?? ["**/*.{ts,tsx,cts,mts}"],
  })),
  ...ensureArray(tseslint.configs.strictTypeCheckedOnly).map((c) => ({
    ...c,
    files: ["**/*.{ts,tsx,cts,mts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: cwd(),
      },
    },
  })),
  {
    files: ["**/*.cts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/*.{mts,cts,ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],
      "@typescript-eslint/typedef": [
        "error",
        {
          parameter: true,
        },
      ],
    },
  },
  {
    files: ["**/*.{mts,cts,ts,tsx,mjs,cjs,js,jsx}"],
    rules: {
      "class-methods-use-this": "error",
    },
  },
  ...ensureArray(json.configs.recommended).map((c) => ({
    // Unlike markdown's recommended config below, @eslint/json's doesn't
    // bake in `files`/`language` itself — the consumer is expected to add
    // both. Without them, ESLint 10 errors immediately: it validates each
    // rule against the language of every config it's combined with, and a
    // JSON-only rule attached with no `language` looks like it's being
    // asked to run against every other language present (markdown, css, ...).
    files: ["**/*.json"],
    // tsconfig*.json is JSONC (TypeScript's own tooling supports // and
    // /* */ comments there) — excluded here, handled strictly-optional below.
    ignores: ["**/tsconfig*.json"],
    language: "json/json",
    ...c,
  })),
  {
    files: ["**/tsconfig*.json"],
    language: "json/jsonc",
    plugins: { json },
    rules: json.configs.recommended.rules,
  },
  ...ensureArray(markdown.configs.recommended).map((c) => ({
    ...c,
    rules: {
      ...c.rules,
      // @eslint/markdown's no-reversed-media-syntax has had catastrophic
      // regex backtracking on files with several long adjacent lines.
      "markdown/no-reversed-media-syntax": "off",
    },
  })),
  ...ensureArray(css.configs.recommended).map((c) => ({
    // Same missing files/language gap as json.configs.recommended above.
    files: ["**/*.css"],
    // @eslint/css's parser doesn't understand Tailwind v4's at-rules
    // (@theme, @apply, @plugin, @source) — it's the only CSS file in this
    // project and is fundamentally incompatible with this linter today,
    // not a real violation. Revisit if @eslint/css adds Tailwind v4 support.
    ignores: ["src/styles/globals.css"],
    language: "css/css",
    ...c,
    rules: {
      ...c.rules,
      // @eslint/css's font-family-fallbacks rule throws on non-CSS files
      // matched by other configs' broader globs; no .css files in this
      // project use it today anyway.
      "css/font-family-fallbacks": "off",
    },
  })),
  {
    ignores: [
      "**/.turbo/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "src-tauri/**",
      ".idea/**",
    ],
  },
  ...ensureArray(prettier),
]);
