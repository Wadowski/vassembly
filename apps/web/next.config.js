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
    "@vassembly/ui-footer",
    "@vassembly/ui-header",
    "@vassembly/ui-text",
    "@vassembly/ui-utils",
    "@vassembly/ui-icons",
    "@vassembly/theme",
  ],
};

export default nextConfig;
