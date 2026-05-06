import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(monorepoRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@vassembly/constants",
    "@vassembly/theme",
    "@vassembly/ui-alert",
    "@vassembly/ui-anchor-list",
    "@vassembly/ui-api-hooks",
    "@vassembly/ui-button",
    "@vassembly/ui-checkbox",
    "@vassembly/ui-drawer-navigation",
    "@vassembly/ui-footer",
    "@vassembly/ui-header",
    "@vassembly/ui-icons",
    "@vassembly/ui-modal",
    "@vassembly/ui-register-form",
    "@vassembly/ui-layout",
    "@vassembly/ui-reset-password-form",
    "@vassembly/ui-snackbar",
    "@vassembly/ui-switch",
    "@vassembly/ui-text",
    "@vassembly/ui-text-field",
    "@vassembly/ui-user-auth",
    "@vassembly/ui-utils",
    "@vassembly/validation",
  ],
};

export default nextConfig;
