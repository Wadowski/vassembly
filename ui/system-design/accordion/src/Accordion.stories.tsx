import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Accordion } from './Accordion';
import { AccordionItem } from './AccordionItem';
import { AccordionPanel } from './AccordionPanel';
import { AccordionTrigger } from './AccordionTrigger';

const meta: Meta = {
  component: Accordion,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'System Design/Accordion',
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = (
  <>
    <AccordionItem value="one">
      <AccordionTrigger>First section</AccordionTrigger>
      <AccordionPanel>Content for the first section.</AccordionPanel>
    </AccordionItem>
    <AccordionItem value="two">
      <AccordionTrigger>Second section</AccordionTrigger>
      <AccordionPanel>Content for the second section.</AccordionPanel>
    </AccordionItem>
    <AccordionItem value="three">
      <AccordionTrigger>Third section</AccordionTrigger>
      <AccordionPanel>Content for the third section.</AccordionPanel>
    </AccordionItem>
  </>
);

export const Default: Story = {
  render: () => (
    <Accordion defaultValue={['one', 'two']} type="multiple">
      {sampleItems}
    </Accordion>
  ),
};

export const SingleFaq: Story = {
  render: () => (
    <Accordion defaultValue="one" type="single">
      {sampleItems}
    </Accordion>
  ),
};

export const VariantBordered: Story = {
  render: () => (
    <Accordion defaultValue={['one']} type="multiple" variant="bordered">
      {sampleItems}
    </Accordion>
  ),
};

export const VariantFlush: Story = {
  render: () => (
    <Accordion defaultValue={['one']} type="multiple" variant="flush">
      {sampleItems}
    </Accordion>
  ),
};

export const DisabledItem: Story = {
  render: () => (
    <Accordion type="multiple">
      <AccordionItem value="one">
        <AccordionTrigger>Open</AccordionTrigger>
        <AccordionPanel>Panel one.</AccordionPanel>
      </AccordionItem>
      <AccordionItem disabled value="two">
        <AccordionTrigger>Disabled</AccordionTrigger>
        <AccordionPanel>Should not open.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="three">
        <AccordionTrigger>Another</AccordionTrigger>
        <AccordionPanel>Panel three.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['two']);

    return (
      <Accordion type="multiple" value={value} onValueChange={setValue}>
        {sampleItems}
      </Accordion>
    );
  },
};
