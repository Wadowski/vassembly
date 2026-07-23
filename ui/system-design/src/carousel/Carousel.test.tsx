import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Carousel } from './Carousel';

describe('Carousel', () => {
  it('renders region with aria-label', () => {
    render(
      <Carousel aria-label="Test carousel">
        <span>One</span>
      </Carousel>,
    );

    expect(screen.getByRole('region', { name: 'Test carousel' })).toBeInTheDocument();
  });

  it('shows first slide and navigates with next and previous', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Carousel aria-label="Items">
        <span>First</span>
        <span>Second</span>
      </Carousel>,
    );

    const slides = container.querySelectorAll('[data-carousel-slide]');
    expect(slides[0]).not.toHaveAttribute('aria-hidden');
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true');

    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(slides[0]).toHaveAttribute('aria-hidden', 'true');
    expect(slides[1]).not.toHaveAttribute('aria-hidden');

    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(slides[0]).not.toHaveAttribute('aria-hidden');
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('disables previous on first slide and next on last slide', () => {
    render(
      <Carousel aria-label="Items">
        <span>A</span>
        <span>B</span>
      </Carousel>,
    );

    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).not.toBeDisabled();
  });

  it('jumps to slide when indicator is activated', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Carousel aria-label="Gallery">
        <span>S1</span>
        <span>S2</span>
        <span>S3</span>
      </Carousel>,
    );

    const slides = container.querySelectorAll('[data-carousel-slide]');
    await user.click(screen.getByRole('button', { name: 'Go to slide 3 of 3' }));
    expect(slides[2]).not.toHaveAttribute('aria-hidden');
    expect(slides[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets aria-hidden on inactive slides', () => {
    const { container } = render(
      <Carousel aria-label="Items">
        <span>Alpha</span>
        <span>Beta</span>
      </Carousel>,
    );

    const slides = container.querySelectorAll('[data-carousel-slide]');
    expect(slides[0]).not.toHaveAttribute('aria-hidden');
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('moves with ArrowLeft and ArrowRight when focus is inside the carousel', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Carousel aria-label="Items">
        <span>Left</span>
        <span>Right</span>
      </Carousel>,
    );

    const slides = container.querySelectorAll('[data-carousel-slide]');
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(slides[1]).not.toHaveAttribute('aria-hidden');

    const nextButton = screen.getByRole('button', { name: 'Next slide' });
    nextButton.focus();
    fireEvent.keyDown(nextButton, { key: 'ArrowLeft', bubbles: true });
    expect(slides[0]).not.toHaveAttribute('aria-hidden');
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not change slide on horizontal swipe below threshold', () => {
    render(
      <Carousel aria-label="Swipe test">
        <span>Start</span>
        <span>End</span>
      </Carousel>,
    );

    const viewport = document.querySelector('[data-carousel-viewport]');
    expect(viewport).not.toBeNull();
    if (!(viewport instanceof HTMLElement)) throw new Error('viewport missing');

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 100, clientY: 50 } as Touch],
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 70, clientY: 50 } as Touch],
    });

    expect(screen.getByText('Start').closest('[data-carousel-slide]')).not.toHaveAttribute('aria-hidden');
  });

  it('advances slide on horizontal swipe past threshold', () => {
    render(
      <Carousel aria-label="Swipe test">
        <span>Start</span>
        <span>End</span>
      </Carousel>,
    );

    const viewport = document.querySelector('[data-carousel-viewport]');
    expect(viewport).not.toBeNull();
    if (!(viewport instanceof HTMLElement)) throw new Error('viewport missing');

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 200, clientY: 50 } as Touch],
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 20, clientY: 50 } as Touch],
    });

    const slides = screen.getByText('End').closest('[data-carousel-slide]');
    expect(slides).not.toHaveAttribute('aria-hidden');
  });

  it('ignores swipe when vertical movement dominates', () => {
    render(
      <Carousel aria-label="Swipe test">
        <span>Start</span>
        <span>End</span>
      </Carousel>,
    );

    const viewport = document.querySelector('[data-carousel-viewport]');
    expect(viewport).not.toBeNull();
    if (!(viewport instanceof HTMLElement)) throw new Error('viewport missing');

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 20, clientY: 20 } as Touch],
    });

    expect(screen.getByText('Start').closest('[data-carousel-slide]')).not.toHaveAttribute('aria-hidden');
  });

  it('renders no dots and disables both arrows for a single slide', () => {
    render(
      <Carousel aria-label="One">
        <span>Only</span>
      </Carousel>,
    );

    expect(screen.queryByRole('button', { name: /Go to slide/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });

  it('renders empty carousel without controls', () => {
    render(<Carousel aria-label="Empty">{null}</Carousel>);

    expect(screen.getByRole('region', { name: 'Empty' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous slide' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
  });

  it('uses custom labels when provided', () => {
    render(
      <Carousel
        aria-label="L"
        labels={{
          previousSlide: 'Back',
          nextSlide: 'Forward',
          goToSlide: ({ slideIndex, slideCount }) => `Pick ${slideIndex + 1}/${slideCount}`,
        }}
      >
        <span>a</span>
        <span>b</span>
      </Carousel>,
    );

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick 2/2' })).toBeInTheDocument();
  });

  it('clamps defaultActiveIndex to slide range', () => {
    const { container } = render(
      <Carousel aria-label="Clamp" defaultActiveIndex={99}>
        <span>First</span>
        <span>Second</span>
      </Carousel>,
    );

    const slides = container.querySelectorAll('[data-carousel-slide]');
    expect(slides[1]).not.toHaveAttribute('aria-hidden');
    expect(slides[0]).toHaveAttribute('aria-hidden', 'true');
  });
});
