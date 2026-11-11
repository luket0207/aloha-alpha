import { useId } from 'react';
import './Hero.scss';

/**
 * Presentational hero. Content is supplied by the caller so it can come from
 * WordPress (or another source) without coupling the component to an API.
 */
export default function Hero({ heading, description, buttonLabel, buttonHref = '/' }) {
  const headingId = useId();

  return (
    <section className="hero" aria-labelledby={headingId}>
      <div className="hero__inner container">
        <div className="hero__content">
          <p className="hero__eyebrow">AlohaAlpha</p>
          <h1 id={headingId}>{heading}</h1>
          {description && <div className="hero__description">{description}</div>}
          {buttonLabel && (
            <a className="hero__button" href={buttonHref}>
              {buttonLabel}
            </a>
          )}
        </div>

        <div className="hero__art" aria-hidden="true">
          <span className="hero__sun" />
          <span className="hero__wave hero__wave--one" />
          <span className="hero__wave hero__wave--two" />
          <span className="hero__wave hero__wave--three" />
        </div>
      </div>
    </section>
  );
}
