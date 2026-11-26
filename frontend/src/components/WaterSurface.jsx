export const WATER_RIPPLE_PRIMARY_DURATION_SECONDS = 16;
export const WATER_RIPPLE_SECONDARY_DURATION_SECONDS = 23;

export function WaterSurface({ id, path, reducedMotion }) {
  const baseGradientId = `${id}-base`;
  const primaryRipplesId = `${id}-primary-ripples`;
  const secondaryRipplesId = `${id}-secondary-ripples`;

  return (
    <>
      <defs>
        <linearGradient id={baseGradientId} x1="0%" x2="100%" y1="12%" y2="88%">
          <stop offset="0%" stopColor="var(--aloha-hero-water-light)" />
          <stop offset="42%" stopColor="var(--aloha-hero-water-dark)" />
          <stop offset="100%" stopColor="var(--aloha-hero-water-light)" />
        </linearGradient>

        <pattern
          id={primaryRipplesId}
          height="128"
          patternUnits="userSpaceOnUse"
          width="240"
          x="0"
          y="0"
        >
          <path
            d="M0 32C30 8 90 8 120 32S210 56 240 32V50C210 74 150 74 120 50S30 26 0 50Z"
            fill="var(--aloha-hero-water-light)"
            fillOpacity="0.3"
          />
          <path
            d="M0 32C30 8 90 8 120 32S210 56 240 32"
            fill="none"
            stroke="var(--aloha-hero-water-light)"
            strokeLinecap="round"
            strokeOpacity="0.62"
            strokeWidth="4"
          />
          {!reducedMotion && (
            <>
              <animate
                attributeName="x"
                dur={`${WATER_RIPPLE_PRIMARY_DURATION_SECONDS}s`}
                from="0"
                repeatCount="indefinite"
                to="-240"
              />
              <animate
                attributeName="y"
                dur={`${WATER_RIPPLE_PRIMARY_DURATION_SECONDS * 0.75}s`}
                repeatCount="indefinite"
                values="0;10;0"
              />
            </>
          )}
        </pattern>

        <pattern
          id={secondaryRipplesId}
          height="176"
          patternUnits="userSpaceOnUse"
          width="320"
          x="-320"
          y="28"
        >
          <path
            d="M0 76C40 48 120 48 160 76S280 104 320 76V92C280 120 200 120 160 92S40 64 0 92Z"
            fill="var(--aloha-hero-water-light)"
            fillOpacity="0.2"
          />
          <path
            d="M0 76C40 48 120 48 160 76S280 104 320 76"
            fill="none"
            stroke="var(--aloha-hero-water-light)"
            strokeLinecap="round"
            strokeOpacity="0.42"
            strokeWidth="6"
          />
          {!reducedMotion && (
            <>
              <animate
                attributeName="x"
                dur={`${WATER_RIPPLE_SECONDARY_DURATION_SECONDS}s`}
                from="-320"
                repeatCount="indefinite"
                to="0"
              />
              <animate
                attributeName="y"
                dur={`${WATER_RIPPLE_SECONDARY_DURATION_SECONDS * 0.7}s`}
                repeatCount="indefinite"
                values="28;20;28"
              />
            </>
          )}
        </pattern>
      </defs>

      <path d={path} fill={`url(#${baseGradientId})`} />
      <path d={path} fill={`url(#${secondaryRipplesId})`} />
      <path d={path} fill={`url(#${primaryRipplesId})`} />
    </>
  );
}
