import { Children, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CarouselLabels, UseCarouselResult } from './types';

const defaultGoToSlideLabel = (args: { slideIndex: number; slideCount: number }): string =>
  `Go to slide ${args.slideIndex + 1} of ${args.slideCount}`;

export const useCarousel = (args: {
  children: ReactNode;
  defaultActiveIndex?: number;
  labels?: CarouselLabels;
}): UseCarouselResult => {
  const { children, defaultActiveIndex = 0, labels } = args;

  const slides = useMemo(() => Children.toArray(children), [children]);
  const slideCount = slides.length;
  const maxIndex = Math.max(0, slideCount - 1);

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(Math.max(0, defaultActiveIndex), Math.max(0, slideCount - 1)),
  );

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const previousLabel = labels?.previousSlide ?? 'Previous slide';
  const nextLabel = labels?.nextSlide ?? 'Next slide';
  const goToSlideLabel = labels?.goToSlide ?? defaultGoToSlideLabel;

  const goToPrevious = useCallback((): void => {
    setActiveIndex((current) => Math.max(0, current - 1));
  }, []);

  const goToNext = useCallback((): void => {
    setActiveIndex((current) => Math.min(maxIndex, current + 1));
  }, [maxIndex]);

  const goToIndex = useCallback(
    (goArgs: { index: number }): void => {
      const next = Math.min(Math.max(0, goArgs.index), maxIndex);
      setActiveIndex(next);
    },
    [maxIndex],
  );

  return {
    slides,
    slideCount,
    maxIndex,
    activeIndex,
    viewportRef,
    touchStartRef,
    previousLabel,
    nextLabel,
    goToSlideLabel,
    goToPrevious,
    goToNext,
    goToIndex,
  };
};
