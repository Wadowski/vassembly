import type { Preview } from '@storybook/react-webpack5'

// Lazy-load FontDecorator to reduce initial memory footprint
const loadFontDecorator = async () => {
  const { FontDecorator } = await import('../decorators/fontDecorator');
  return FontDecorator;
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  decorators: [
    (story) => {
      // FontDecorator will be loaded dynamically when needed
      return story();
    },
  ],
};

export default preview;