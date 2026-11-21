export const TURTLE_INTERVAL_MIN_MS = 5000;
export const TURTLE_INTERVAL_MAX_MS = 15000;
export const TURTLE_DURATION_MIN_MS = 5000;
export const TURTLE_DURATION_MAX_MS = 7000;

function randomUnit(random) {
  return Math.min(1, Math.max(0, Number(random()) || 0));
}

export function randomTurtleInterval(random = Math.random) {
  return TURTLE_INTERVAL_MIN_MS
    + ((TURTLE_INTERVAL_MAX_MS - TURTLE_INTERVAL_MIN_MS) * randomUnit(random));
}

export function randomTurtleDuration(random = Math.random) {
  return TURTLE_DURATION_MIN_MS
    + ((TURTLE_DURATION_MAX_MS - TURTLE_DURATION_MIN_MS) * randomUnit(random));
}

export function calculateTurtleHeading(start, end) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  return ((Math.atan2(deltaY, deltaX) * 180) / Math.PI) + 90;
}

function randomTopForHalf(half, containerHeight, turtleHeight, random) {
  const sectionHeight = Math.max(1, containerHeight);
  const imageHeight = Math.min(Math.max(0, turtleHeight), sectionHeight / 2);
  const midpoint = sectionHeight / 2;
  const centerInset = imageHeight / 2;
  const minimumCenter = half === 'top' ? centerInset : midpoint + centerInset;
  const maximumCenter = half === 'top' ? midpoint - centerInset : sectionHeight - centerInset;
  const available = Math.max(0, maximumCenter - minimumCenter);
  const center = minimumCenter + (available * randomUnit(random));
  return center - (imageHeight / 2);
}

export function createTurtleJourney({
  containerHeight,
  containerWidth,
  random = Math.random,
  turtleHeight,
  turtleWidth,
}) {
  const width = Math.max(1, containerWidth);
  const imageWidth = Math.max(1, turtleWidth);
  const leftToRight = randomUnit(random) < 0.5;
  const entryHalf = randomUnit(random) < 0.5 ? 'top' : 'bottom';
  const exitHalf = entryHalf === 'top' ? 'bottom' : 'top';
  const offscreenPadding = 4;
  const duration = randomTurtleDuration(random);
  const start = {
    x: leftToRight ? -(imageWidth + offscreenPadding) : width + offscreenPadding,
    y: randomTopForHalf(entryHalf, containerHeight, turtleHeight, random),
  };
  const end = {
    x: leftToRight ? width + offscreenPadding : -(imageWidth + offscreenPadding),
    y: randomTopForHalf(exitHalf, containerHeight, turtleHeight, random),
  };

  return {
    direction: leftToRight ? 'left-to-right' : 'right-to-left',
    duration,
    entryHalf,
    exitHalf,
    heading: calculateTurtleHeading(start, end),
    start,
    end,
  };
}
