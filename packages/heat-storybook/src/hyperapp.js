import React from 'react';
import { app, text } from 'hyperapp';

export const t = text;

const el = React.createElement;

export const Component = ({ children, className, view, ...props }) => {
  const dom = React.useRef();

  React.useEffect(() => {
    app({
      init: { ...props },
      view: (state) => view(state, children),
      node: dom.current,
    });
  }, [props, children, view]);

  return el('div', null, el('div', { ref: dom }));
};
