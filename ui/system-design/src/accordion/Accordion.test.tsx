import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Accordion } from './Accordion';
import { AccordionItem } from './AccordionItem';
import { AccordionPanel } from './AccordionPanel';
import { AccordionTrigger } from './AccordionTrigger';
import styles from './Accordion.module.scss';

const TripleAccordion = (): JSX.Element => (
  <Accordion data-testid="accordion" type="multiple">
    <AccordionItem value="a">
      <AccordionTrigger>Alpha</AccordionTrigger>
      <AccordionPanel>Panel A</AccordionPanel>
    </AccordionItem>
    <AccordionItem value="b">
      <AccordionTrigger>Bravo</AccordionTrigger>
      <AccordionPanel>Panel B</AccordionPanel>
    </AccordionItem>
    <AccordionItem value="c">
      <AccordionTrigger>Charlie</AccordionTrigger>
      <AccordionPanel>Panel C</AccordionPanel>
    </AccordionItem>
  </Accordion>
);

describe('Accordion', () => {
  describe('Rendering', () => {
    it('renders triggers and expands panels when defaultValue includes items', () => {
      render(
        <Accordion defaultValue={['a']} type="multiple">
          <AccordionItem value="a">
            <AccordionTrigger>Alpha</AccordionTrigger>
            <AccordionPanel>Panel A</AccordionPanel>
          </AccordionItem>
        </Accordion>,
      );
      expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Panel A')).toBeInTheDocument();
    });
  });

  describe('type="multiple"', () => {
    it('opens one section without closing others', async () => {
      const user = userEvent.setup();
      render(<TripleAccordion />);

      await user.click(screen.getByRole('button', { name: 'Alpha' }));
      await user.click(screen.getByRole('button', { name: 'Bravo' }));

      expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Bravo' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Panel A')).toBeInTheDocument();
      expect(screen.getByText('Panel B')).toBeInTheDocument();
    });

    it('wires aria-controls to panel id', () => {
      render(<TripleAccordion />);
      const trigger = screen.getByRole('button', { name: 'Alpha' });
      const controls = trigger.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      const panel = document.getElementById(controls ?? '');
      expect(panel).toBeTruthy();
      expect(panel).toHaveAttribute('role', 'region');
    });
  });

  describe('type="single"', () => {
    it('closes the previous section when opening another', async () => {
      const user = userEvent.setup();
      render(
        <Accordion defaultValue="a" type="single">
          <AccordionItem value="a">
            <AccordionTrigger>A</AccordionTrigger>
            <AccordionPanel>PA</AccordionPanel>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>B</AccordionTrigger>
            <AccordionPanel>PB</AccordionPanel>
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'true');
      await user.click(screen.getByRole('button', { name: 'B' }));
      expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Disabled item', () => {
    it('does not toggle when trigger is disabled', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="multiple">
          <AccordionItem value="x">
            <AccordionTrigger>On</AccordionTrigger>
            <AccordionPanel>PX</AccordionPanel>
          </AccordionItem>
          <AccordionItem disabled value="y">
            <AccordionTrigger>Off</AccordionTrigger>
            <AccordionPanel>PY</AccordionPanel>
          </AccordionItem>
        </Accordion>,
      );

      await user.click(screen.getByRole('button', { name: 'Off' }));
      expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('applies variantDefault by default', () => {
      render(
        <Accordion data-testid="acc" type="multiple">
          <AccordionItem value="a">
            <AccordionTrigger>T</AccordionTrigger>
            <AccordionPanel>P</AccordionPanel>
          </AccordionItem>
        </Accordion>,
      );
      expect(screen.getByTestId('acc').className).toContain(styles.variantDefault);
    });

    it('applies variantBordered when variant is bordered', () => {
      render(
        <Accordion data-testid="acc" type="multiple" variant="bordered">
          <AccordionItem value="a">
            <AccordionTrigger>T</AccordionTrigger>
            <AccordionPanel>P</AccordionPanel>
          </AccordionItem>
        </Accordion>,
      );
      expect(screen.getByTestId('acc').className).toContain(styles.variantBordered);
    });
  });

  describe('Keyboard type="single"', () => {
    it('moves focus with ArrowDown, Home, and End', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single">
          <AccordionItem value="a">
            <AccordionTrigger>A</AccordionTrigger>
            <AccordionPanel>PA</AccordionPanel>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>B</AccordionTrigger>
            <AccordionPanel>PB</AccordionPanel>
          </AccordionItem>
          <AccordionItem value="c">
            <AccordionTrigger>C</AccordionTrigger>
            <AccordionPanel>PC</AccordionPanel>
          </AccordionItem>
        </Accordion>,
      );

      const a = screen.getByRole('button', { name: 'A' });
      const b = screen.getByRole('button', { name: 'B' });
      const c = screen.getByRole('button', { name: 'C' });

      a.focus();
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(b);
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(c);
      await user.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(b);
      await user.keyboard('{Home}');
      expect(document.activeElement).toBe(a);
      await user.keyboard('{End}');
      expect(document.activeElement).toBe(c);
    });
  });

  describe('Controlled multiple', () => {
    it('reflects value from props and calls onValueChange', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      const Controlled = (): JSX.Element => {
        const [value, setValue] = useState<string[]>(['a']);

        return (
          <Accordion
            type="multiple"
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
              setValue(next);
            }}
          >
            <AccordionItem value="a">
              <AccordionTrigger>A</AccordionTrigger>
              <AccordionPanel>PA</AccordionPanel>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>B</AccordionTrigger>
              <AccordionPanel>PB</AccordionPanel>
            </AccordionItem>
          </Accordion>
        );
      };

      render(<Controlled />);
      expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'true');

      await user.click(screen.getByRole('button', { name: 'B' }));
      expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
      expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
