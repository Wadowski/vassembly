import { parse } from 'node-html-parser';

import { resolveAbsoluteUrl } from './urlGuards';

import type { ExtractPageContentParams, WebPageContentResult } from './types';

const NOISE_SELECTORS = ['script', 'style', 'nav', 'header', 'footer', 'aside'];

const normalizeWhitespace = ({ text }: { text: string }): string =>
  text.replace(/\s+/g, ' ').trim();

const collectMediaUrls = ({
  root,
  baseUrl,
}: {
  root: ReturnType<typeof parse>;
  baseUrl: string;
}): { images: string[]; videos: string[] } => {
  const images = new Set<string>();
  const videos = new Set<string>();

  for (const image of root.querySelectorAll('img')) {
    const src = image.getAttribute('src');

    if (!src) {
      continue;
    }

    const resolved = resolveAbsoluteUrl({ value: src, baseUrl });

    if (resolved) {
      images.add(resolved);
    }
  }

  for (const video of root.querySelectorAll('video')) {
    const src = video.getAttribute('src');

    if (src) {
      const resolved = resolveAbsoluteUrl({ value: src, baseUrl });

      if (resolved) {
        videos.add(resolved);
      }
    }

    for (const source of video.querySelectorAll('source')) {
      const sourceSrc = source.getAttribute('src');

      if (!sourceSrc) {
        continue;
      }

      const resolved = resolveAbsoluteUrl({ value: sourceSrc, baseUrl });

      if (resolved) {
        videos.add(resolved);
      }
    }
  }

  return {
    images: [...images],
    videos: [...videos],
  };
};

export const extractPageContent = ({
  html,
  baseUrl,
}: ExtractPageContentParams): WebPageContentResult => {
  const root = parse(html);

  for (const selector of NOISE_SELECTORS) {
    for (const element of root.querySelectorAll(selector)) {
      element.remove();
    }
  }

  const body = root.querySelector('body') ?? root;
  const text = normalizeWhitespace({ text: body.text });
  const { images, videos } = collectMediaUrls({ root, baseUrl });

  return {
    url: baseUrl,
    text,
    images,
    videos,
  };
};
