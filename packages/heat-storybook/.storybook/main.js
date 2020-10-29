const essentials = require.resolve('@storybook/addon-essentials');
const links = require.resolve('@storybook/addon-links');
const preset = require.resolve('@storybook/preset-create-react-app');

module.exports = {
  stories: ['../src/**/*.stories.js'],
  addons: [essentials, links, preset],
};

