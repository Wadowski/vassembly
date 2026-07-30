export type CredentialHeaderMapping = {
  headerName: string;
  fieldKey: string;
  format?: 'bearer';
  optional?: boolean;
};

export type CredentialMapping =
  | { kind: 'header'; headers: CredentialHeaderMapping[] }
  | { kind: 'none' };
