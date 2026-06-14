import { config } from "@vassembly/eslint-config/base";
import globals from "globals";

export default [
  ...config,
  {
    ignores: [".features-gen/**", "dist/**", "node_modules/**", ".playwright/**"],
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "turbo/no-undeclared-env-vars": "off",
    },
  },
  {
    rules: {
      "turbo/no-undeclared-env-vars": "off",
      "no-empty-pattern": "off",
    },
  },
];
