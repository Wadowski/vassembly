import type { MutableRefObject, ReactNode, RefObject } from 'react';

export type CarouselLabels = {
  previousSlide?: string;
  nextSlide?: string;
  goToSlide?: (args: { slideIndex: number; slideCount: number }) => string;
};

export type CarouselProps = {
  children: ReactNode;
  'aria-label': string;
  className?: string;
  defaultActiveIndex?: number;
  labels?: CarouselLabels;
};

export type UseCarouselResult = {
  slides: ReturnType<typeof import('react').Children.toArray>;
  slideCount: number;
  maxIndex: number;
  activeIndex: number;
  viewportRef: RefObject<HTMLDivElement>;
  touchStartRef: MutableRefObject<{ x: number; y: number } | null>;
  previousLabel: string;
  nextLabel: string;
  goToSlideLabel: (args: { slideIndex: number; slideCount: number }) => string;
  goToPrevious: () => void;
  goToNext: () => void;
  goToIndex: (args: { index: number }) => void;
};
