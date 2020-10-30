import { Button } from "./Button";
import { Component } from "./hyperapp";

const Template = (args) =>
  Component({ view: Button, children: "Button", ...args });

export default {
  title: "Example/Button",
  component: Template,
  argTypes: {
    backgroundColor: { control: "color" },
  },
};

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: "Button",
  children: "Primary Button",
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: "Button",
  children: "Secondary Button",
};

export const Large = Template.bind({});
Large.args = {
  size: "large",
  label: "Button",
  children: "Large Button",
};

export const Small = Template.bind({});
Small.args = {
  size: "small",
  label: "Button",
  children: "Small Button",
};
