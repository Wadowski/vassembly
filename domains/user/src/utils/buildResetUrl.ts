import { config } from "@vassembly/config";

interface BuildResetUrlParams {
  token: string;
}

export const buildResetUrl = ({ token }: BuildResetUrlParams): string | null => {
  const base = config.apps.web.passwordResetUrl?.trim() ?? "";
  if (!base) {
    return null;
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};
