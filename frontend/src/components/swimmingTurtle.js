export const TURTLE_INTERVAL_MIN_MS = 5000;
export const TURTLE_INTERVAL_MAX_MS = 15000;
export const TURTLE_DURATION_MIN_MS = 5000;
export const TURTLE_DURATION_MAX_MS = 7000;

const DIRECTIONS = ['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top'];

function randomUnit(random) {
  return Math.min(1, Math.max(0, Number(random()) || 0));
}

export function randomTurtleInterval(random = Math.random) {
  return TURTLE_INTERVAL_MIN_MS
    + ((TURTLE_INTERVAL_MAX_MS - TURTLE_INTERVAL_MIN_MS) * randomUnit(random));
}

export function randomTurtleDuration(
  random = Math.random,
  minDurationMs = TURTLE_DURATION_MIN_MS,
  maxDurationMs = TURTLE_DURATION_MAX_MS,
) {
  return minDurationMs + ((maxDurationMs - minDurationMs) * randomUnit(random));
}

export function calculateTurtleHeading(start, end) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  return ((Math.atan2(deltaY, deltaX) * 180) / Math.PI) + 90;
}

function centerInHalf(sectionSize, imageSize, farHalf, position) {
  const half = sectionSize / 2;
  const inset = Math.min(imageSize / 2, half / 2);
  return (farHalf ? half : 0) + inset + ((half - (2 * inset)) * position);
}

export function createTurtleJourney({
  containerHeight,
  containerWidth,
  minDurationMs,
  maxDurationMs,
  random = Math.random,
  turtleHeight,
  turtleWidth,
}) {
  const width = Math.max(1, containerWidth);
  const height = Math.max(1, containerHeight);
  const imageWidth = Math.max(1, turtleWidth);
  const imageHeight = Math.max(1, turtleHeight);
  const direction = DIRECTIONS[Math.min(DIRECTIONS.length - 1, Math.floor(randomUnit(random) * DIRECTIONS.length))];
  const vertical = direction === 'top-to-bottom' || direction === 'bottom-to-top';
  const reversed = direction === 'right-to-left' || direction === 'bottom-to-top';
  const entryInFarHalf = randomUnit(random) >= 0.5;
  const [nearHalf, farHalf] = vertical ? ['left', 'right'] : ['top', 'bottom'];
  const referenceDuration = randomTurtleDuration(random, minDurationMs, maxDurationMs);
  const entryPosition = randomUnit(random);
  const exitPosition = randomUnit(random);

  const horizontalEntry = centerInHalf(height, imageHeight, entryInFarHalf, entryPosition);
  const horizontalExit = centerInHalf(height, imageHeight, !entryInFarHalf, exitPosition);
  const crossEntry = vertical
    ? centerInHalf(width, imageWidth, entryInFarHalf, entryPosition)
    : horizontalEntry;
  const crossExit = vertical
    ? centerInHalf(width, imageWidth, !entryInFarHalf, exitPosition)
    : horizontalExit;

  // The sprite fits inside this radius at every heading and wiggle angle.
  const clearance = Math.hypot(imageWidth, imageHeight) / 2 + 4;
  const farEdge = (vertical ? height : width) + clearance;
  const travelStart = reversed ? farEdge : -clearance;
  const travelEnd = reversed ? -clearance : farEdge;
  const start = {
    x: (vertical ? crossEntry : travelStart) - (imageWidth / 2),
    y: (vertical ? travelStart : crossEntry) - (imageHeight / 2),
  };
  const end = {
    x: (vertical ? crossExit : travelEnd) - (imageWidth / 2),
    y: (vertical ? travelEnd : crossExit) - (imageHeight / 2),
  };

  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  // For a vertical pass, project the same random positions onto a reference horizontal pass.
  const referenceDistance = vertical
    ? Math.hypot(width + (2 * clearance), horizontalExit - horizontalEntry)
    : distance;

  return {
    direction,
    duration: referenceDuration * (distance / referenceDistance),
    entryHalf: entryInFarHalf ? farHalf : nearHalf,
    exitHalf: entryInFarHalf ? nearHalf : farHalf,
    heading: calculateTurtleHeading(start, end),
    start,
    end,
  };
}
