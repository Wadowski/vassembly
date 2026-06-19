import { nextJsConfig } from "@vassembly/eslint-config/next-js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    ignores: [".features-gen/**"],
  },
  {
    files: ["playwright.config.js", "e2e/loadE2eEnv.cjs", "vitest.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
];
