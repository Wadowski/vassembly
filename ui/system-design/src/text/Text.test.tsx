import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { Text } from './Text';

describe('Text', () => {
  describe('Default rendering', () => {
    it('renders children', () => {
      render(<Text>Hello world</Text>);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders as a <p> element by default', () => {
      render(<Text>Body text</Text>);
      expect(screen.getByText('Body text').tagName).toBe('P');
    });

    it('applies the body1 variant class by default', () => {
      render(<Text>Default</Text>);
      expect(screen.getByText('Default').className).toContain('variantBody1');
    });
  });

  describe('Variant default elements', () => {
    it('renders h1 variant as <h1>', () => {
      render(<Text variant="h1">Heading 1</Text>);
      expect(screen.getByText('Heading 1').tagName).toBe('H1');
    });

    it('renders h2 variant as <h2>', () => {
      render(<Text variant="h2">Heading 2</Text>);
      expect(screen.getByText('Heading 2').tagName).toBe('H2');
    });

    it('renders h3 variant as <h3>', () => {
      render(<Text variant="h3">Heading 3</Text>);
      expect(screen.getByText('Heading 3').tagName).toBe('H3');
    });

    it('renders body1 variant as <p>', () => {
      render(<Text variant="body1">Body 1</Text>);
      expect(screen.getByText('Body 1').tagName).toBe('P');
    });

    it('renders body2 variant as <p>', () => {
      render(<Text variant="body2">Body 2</Text>);
      expect(screen.getByText('Body 2').tagName).toBe('P');
    });

    it('renders label variant as <span>', () => {
      render(<Text variant="label">Label</Text>);
      expect(screen.getByText('Label').tagName).toBe('SPAN');
    });

    it('renders caption variant as <span>', () => {
      render(<Text variant="caption">Caption</Text>);
      expect(screen.getByText('Caption').tagName).toBe('SPAN');
    });
  });

  describe('Variant CSS classes', () => {
    it('applies variantH1 class for h1 variant', () => {
      render(<Text variant="h1">H1</Text>);
      expect(screen.getByText('H1').className).toContain('variantH1');
    });

    it('applies variantH2 class for h2 variant', () => {
      render(<Text variant="h2">H2</Text>);
      expect(screen.getByText('H2').className).toContain('variantH2');
    });

    it('applies variantH3 class for h3 variant', () => {
      render(<Text variant="h3">H3</Text>);
      expect(screen.getByText('H3').className).toContain('variantH3');
    });

    it('applies variantBody1 class for body1 variant', () => {
      render(<Text variant="body1">Body1</Text>);
      expect(screen.getByText('Body1').className).toContain('variantBody1');
    });

    it('applies variantBody2 class for body2 variant', () => {
      render(<Text variant="body2">Body2</Text>);
      expect(screen.getByText('Body2').className).toContain('variantBody2');
    });

    it('applies variantLabel class for label variant', () => {
      render(<Text variant="label">LabelText</Text>);
      expect(screen.getByText('LabelText').className).toContain('variantLabel');
    });

    it('applies variantCaption class for caption variant', () => {
      render(<Text variant="caption">CaptionText</Text>);
      expect(screen.getByText('CaptionText').className).toContain('variantCaption');
    });
  });

  describe('`as` prop overrides the rendered element', () => {
    it('overrides h1 variant element with as="span"', () => {
      render(<Text variant="h1" as="span">Title</Text>);
      expect(screen.getByText('Title').tagName).toBe('SPAN');
    });

    it('preserves the variant class when as overrides the element', () => {
      render(<Text variant="h1" as="span">Title</Text>);
      expect(screen.getByText('Title').className).toContain('variantH1');
    });

    it('overrides body1 variant element with as="div"', () => {
      render(<Text variant="body1" as="div">Paragraph</Text>);
      expect(screen.getByText('Paragraph').tagName).toBe('DIV');
    });

    it('overrides label variant element with as="label"', () => {
      render(<Text variant="label" as="label">Field Label</Text>);
      expect(screen.getByText('Field Label').tagName).toBe('LABEL');
    });

    it('overrides h2 variant element with as="h3"', () => {
      render(<Text variant="h2" as="h3">Section</Text>);
      expect(screen.getByText('Section').tagName).toBe('H3');
    });
  });

  describe('className merging', () => {
    it('merges custom className with variant class', () => {
      render(<Text variant="body1" className="custom-class">Text</Text>);
      const el = screen.getByText('Text');
      expect(el.className).toContain('variantBody1');
      expect(el.className).toContain('custom-class');
    });

    it('applies base text class alongside variant class', () => {
      render(<Text variant="h1">Title</Text>);
      const el = screen.getByText('Title');
      expect(el.className).toContain('text');
      expect(el.className).toContain('variantH1');
    });
  });

  describe('HTML attribute forwarding', () => {
    it('forwards id attribute', () => {
      render(<Text id="my-text">Text</Text>);
      expect(screen.getByText('Text')).toHaveAttribute('id', 'my-text');
    });

    it('forwards data-testid attribute', () => {
      render(<Text data-testid="text-el">Text</Text>);
      expect(screen.getByTestId('text-el')).toBeInTheDocument();
    });

    it('forwards aria-label attribute', () => {
      render(<Text aria-label="accessible label">Text</Text>);
      expect(screen.getByText('Text')).toHaveAttribute('aria-label', 'accessible label');
    });
  });

  describe('forwardRef', () => {
    it('forwards ref to the root DOM element', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Text ref={ref}>Ref text</Text>);
      expect(ref.current).not.toBeNull();
      expect(ref.current?.textContent).toBe('Ref text');
    });

    it('forwards ref to the correct element when as is used', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Text variant="h1" as="section" ref={ref}>Section</Text>);
      expect(ref.current?.tagName).toBe('SECTION');
    });
  });

  describe('displayName', () => {
    it('has displayName set to Text', () => {
      expect(Text.displayName).toBe('Text');
    });
  });

  describe('JSX children', () => {
    it('renders JSX children', () => {
      render(
        <Text variant="body1">
          <strong data-testid="bold">Bold content</strong>
        </Text>,
      );
      expect(screen.getByTestId('bold')).toBeInTheDocument();
    });
  });
});
