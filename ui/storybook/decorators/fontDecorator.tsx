import React from 'react';
import { StoryFn } from "@storybook/react-webpack5";

const FONT_STYLES = `
  html {
    --font-family-body: 'Inter', sans-serif;
    --font-family-display: 'Space Grotesk', sans-serif;
  }
`;

export const FontDecorator = (Story: StoryFn) => (
  <>
    <style>{FONT_STYLES}</style>
    <Story />
  </>
);
