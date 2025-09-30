import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#E6EAD7',
        },
        {
          name: 'dark',
          value: '#29432B',
        },
        {
          name: 'white',
          value: '#FFFFFF',
        },
      ],
    },
  },
};

export default preview;
