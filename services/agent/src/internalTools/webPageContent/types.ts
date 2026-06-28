export interface WebPageContentParams {
  args: Record<string, unknown>;
}

export interface WebPageContentResult {
  url: string;
  text: string;
  images: string[];
  videos: string[];
}
