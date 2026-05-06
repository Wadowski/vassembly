export interface LegalSection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export interface LegalDocumentShellProps {
  readonly title: string;
  readonly sections: readonly LegalSection[];
}
