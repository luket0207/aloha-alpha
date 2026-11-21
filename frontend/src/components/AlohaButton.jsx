import { forwardRef } from 'react';
import { normalizeAlohaButtonVariant } from './alohaButton.js';
import './AlohaButton.scss';

const AlohaButton = forwardRef(function AlohaButton({
  children,
  className = '',
  type = 'button',
  variant = 'primary',
  ...buttonProps
}, ref) {
  const normalizedVariant = normalizeAlohaButtonVariant(variant);
  const classes = [
    'aloha-button',
    `aloha-button--${normalizedVariant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} ref={ref} type={type} {...buttonProps}>
      <span className="aloha-button__label">{children}</span>
    </button>
  );
});

export default AlohaButton;
