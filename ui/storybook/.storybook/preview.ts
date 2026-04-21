import type { Preview } from '@storybook/react-webpack5'
import { FontDecorator } from '../decorators/fontDecorator';

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
    FontDecorator,
  ],
};

export default preview;