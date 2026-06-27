export interface FormatInternalToolNameParams {
  domain: string;
  action: string;
}

export const formatInternalToolId = ({ domain, action }: FormatInternalToolNameParams): string =>
  `${domain}-${action}`;

export const formatInternalToolDisplayName = ({
  domain,
  action,
}: FormatInternalToolNameParams): string => `${domain} - ${action}`;
