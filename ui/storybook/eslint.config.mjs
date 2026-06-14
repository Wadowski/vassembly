import { config } from "@vassembly/eslint-config/react-internal";

export default [
  ...config,
  {
    ignores: ["storybook-static/**"],
  },
];
