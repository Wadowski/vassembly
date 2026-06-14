import type { Preview } from '@storybook/react-webpack5'

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
    (story) => story(),
  ],
};

export default preview;