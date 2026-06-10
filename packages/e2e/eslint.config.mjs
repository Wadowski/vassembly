import { config } from "@vassembly/eslint-config/base";

export default [
  ...config,
  {
    ignores: [".features-gen/**", "dist/**", "node_modules/**", ".playwright/**"],
  },
  {
    rules: {
      "turbo/no-undeclared-env-vars": "off",
      "no-empty-pattern": "off",
    },
  },
];
