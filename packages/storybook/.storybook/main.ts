import type { StorybookConfig } from '@storybook/react-webpack5';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiPath = resolve(__dirname, '../../../ui');
const themePath = resolve(__dirname, '../../theme');
const themeTokensPath = resolve(__dirname, '../../theme/src/tokens');

const config: StorybookConfig = {
  stories: [
    `${uiPath}/**/*.stories.@(js|jsx|mjs|ts|tsx)`,
    // `${themePath}/**/*.stories.@(js|jsx|mjs|ts|tsx)`,
  ],
  addons: [
    getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: getAbsolutePath('@storybook/react-webpack5'),
  webpackFinal: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    config.resolve.alias['@vassembly/theme'] = resolve(__dirname, '../../theme');

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    const sassRule = {
      test: /\.module\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: true,
            esModule: true,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            additionalData: (content: string) => `@import '${themeTokensPath}/index.scss';\n${content}`,
            sassOptions: {
              includePaths: [themeTokensPath],
            },
          },
        },
      ],
    };

    config.module.rules.push(sassRule);

    return config;
  },
};

export default config;