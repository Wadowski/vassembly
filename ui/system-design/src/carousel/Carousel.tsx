import { type KeyboardEvent, type TouchEvent } from 'react';
import { KeyboardArrowLeftIcon, KeyboardArrowRightIcon } from '@vassembly/ui-system-design/icons';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './Carousel.module.scss';
import type { CarouselProps } from './types';
import { useCarousel } from './useCarousel';

const isEditableTarget = (element: EventTarget | null): boolean => {
  if (element === null || !(element instanceof HTMLElement)) return false;
  return Boolean(element.closest('input, textarea, select, [contenteditable="true"]'));
};

export const Carousel = ({
  children,
  'aria-label': ariaLabel,
  className,
  defaultActiveIndex = 0,
  labels,
}: CarouselProps): JSX.Element => {
  const {
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
  } = useCarousel({ children, defaultActiveIndex, labels });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (slideCount <= 1) return;
    if (isEditableTarget(event.target)) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>): void => {
    if (slideCount <= 1) return;
    const touch = event.touches[0];
    if (touch === undefined) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>): void => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (start === null || slideCount <= 1) return;
    const touch = event.changedTouches[0];
    if (touch === undefined) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const width = viewportRef.current?.clientWidth ?? 0;
    const threshold = Math.max(48, width * 0.15);
    if (Math.abs(dx) < threshold) return;
    if (dx > 0) {
      goToPrevious();
      return;
    }
    goToNext();
  };

  const canGoPrevious = slideCount > 0 && activeIndex > 0;
  const canGoNext = slideCount > 0 && activeIndex < maxIndex;
  const translatePercent = -activeIndex * 100;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className={resolveClassName(styles.root, className)}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.row}>
        {slideCount > 0 && (
          <button
            type="button"
            className={styles.arrowButton}
            aria-label={previousLabel}
            disabled={!canGoPrevious}
            onClick={goToPrevious}
          >
            <span aria-hidden="true">
              <KeyboardArrowLeftIcon />
            </span>
          </button>
        )}
        <div
          ref={viewportRef}
          className={styles.viewport}
          data-carousel-viewport=""
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slideCount > 0 ? (
            <div
              className={styles.track}
              style={{ transform: `translateX(${translatePercent}%)` }}
            >
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;
                return (
                  <div
                    key={index}
                    className={styles.slide}
                    data-carousel-slide=""
                    aria-hidden={isActive ? undefined : 'true'}
                  >
                    {slide}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        {slideCount > 0 && (
          <button
            type="button"
            className={styles.arrowButton}
            aria-label={nextLabel}
            disabled={!canGoNext}
            onClick={goToNext}
          >
            <span aria-hidden="true">
              <KeyboardArrowRightIcon />
            </span>
          </button>
        )}
      </div>
      {slideCount > 1 ? (
        <div
          className={styles.dots}
          role="group"
          aria-label={`${ariaLabel} slide indicators`}
        >
          {slides.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                aria-label={goToSlideLabel({ slideIndex: index, slideCount })}
                aria-pressed={isActive}
                className={resolveClassName(styles.dot, isActive && styles.dotActive)}
                onClick={() => goToIndex({ index })}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

Carousel.displayName = 'Carousel';
