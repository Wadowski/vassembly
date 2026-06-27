export interface WebSearchParams {
  args: Record<string, unknown>;
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
}
