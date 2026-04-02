import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'System Design/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: { control: false },
    isOpen: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const ModalDemo = ({
  title,
  size,
  initialOpen = true,
}: {
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  initialOpen?: boolean;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const handleOpen = (): void => {
    setIsOpen(true);
  };

  const handleClose = (): void => {
    setIsOpen(false);
  };

  return (
    <>
      <button type="button" onClick={handleOpen}>
        Open modal
      </button>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} size={size}>
        <p>Dialog content. Close with the button, backdrop, or Escape.</p>
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const WithTitle: Story = {
  render: () => <ModalDemo title="Modal title" />,
};

export const SizeSmall: Story = {
  render: () => <ModalDemo title="Small" size="sm" />,
};

export const SizeMedium: Story = {
  render: () => <ModalDemo title="Medium" size="md" />,
};

export const SizeLarge: Story = {
  render: () => <ModalDemo title="Large" size="lg" />,
};
