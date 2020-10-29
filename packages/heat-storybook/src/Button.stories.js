import { Button } from './Button';
import { Component, t } from './hyperapp';

const Template = (args) =>
  Component({ view: Button, children: t('Button'), ...args });

export default {
  title: 'Example/Button',
  component: Template,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Button',
  children: t('Primary Button'),
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: 'Button',
  children: t('Secondary Button'),
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  label: 'Button',
  children: t('Large Button'),
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  label: 'Button',
  children: t('Small Button'),
};
