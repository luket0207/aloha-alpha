import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { normalizeAlohaButtonVariant } from './alohaButton.js';
import './AlohaButton.scss';

const AlohaButton = forwardRef(function AlohaButton({
  children,
  className = '',
  tone,
  to,
  type = 'button',
  variant = 'primary',
  ...buttonProps
}, ref) {
  const normalizedVariant = normalizeAlohaButtonVariant(variant);
  const classes = [
    'aloha-button',
    `aloha-button--${normalizedVariant}`,
    tone === 'cream' ? 'aloha-button--tone-cream' : '',
    className,
  ].filter(Boolean).join(' ');

  const Control = to ? Link : 'button';
  const controlProps = to ? { to } : { type };

  return (
    <Control className={classes} ref={ref} {...controlProps} {...buttonProps}>
      <span className="aloha-button__label">{children}</span>
    </Control>
  );
});

export default AlohaButton;
