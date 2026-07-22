import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(monorepoRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/settings/ai-integrations',
        destination: '/agents#ai-integrations',
        permanent: true,
      },
      {
        source: '/settings/ai-integrations/create',
        destination: '/agents/ai-integrations/create',
        permanent: true,
      },
      {
        source: '/settings/ai-integrations/:id/edit',
        destination: '/agents/ai-integrations/:id/edit',
        permanent: true,
      },
    ];
  },
  transpilePackages: [
    "@vassembly/constants",
    "@vassembly/ui-system-design",
    "@vassembly/ui-api-hooks",
    "@vassembly/ui-drawer-navigation",
    "@vassembly/ui-footer",
    "@vassembly/ui-header",
    "@vassembly/ui-register-form",
    "@vassembly/ui-layout",
    "@vassembly/ui-reset-password-form",
    "@vassembly/ui-user-auth",
    "@vassembly/validation",
  ]
};

export default nextConfig;
