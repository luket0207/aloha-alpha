import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateTurtleHeading,
  createTurtleJourney,
  randomTurtleDuration,
  randomTurtleInterval,
  TURTLE_DURATION_MAX_MS,
  TURTLE_DURATION_MIN_MS,
  TURTLE_INTERVAL_MAX_MS,
  TURTLE_INTERVAL_MIN_MS,
} from './swimmingTurtle.js';

test('keeps turtle intervals and journey durations within the specified bounds', () => {
  assert.equal(randomTurtleInterval(() => 0), TURTLE_INTERVAL_MIN_MS);
  assert.equal(randomTurtleInterval(() => 1), TURTLE_INTERVAL_MAX_MS);
  assert.equal(randomTurtleDuration(() => 0), TURTLE_DURATION_MIN_MS);
  assert.equal(randomTurtleDuration(() => 1), TURTLE_DURATION_MAX_MS);
});

test('draws a slower duration without changing the same journey or interval', () => {
  for (const roll of [0, 0.5, 1]) {
    const bounds = {
      containerHeight: 500,
      containerWidth: 1000,
      turtleHeight: 80,
      turtleWidth: 100,
    };
    const createJourney = (minDurationMs, maxDurationMs) => {
      const values = [0.1, roll, roll, 0.25, 0.75];
      return createTurtleJourney({ ...bounds, random: () => values.shift(), minDurationMs, maxDurationMs });
    };
    const { duration: normalDuration, ...normalRoute } = createJourney();
    const { duration: slowDuration, ...slowRoute } = createJourney(10000, 14000);

    assert.equal(slowDuration, 10000 + (4000 * roll));
    assert.equal(slowDuration, normalDuration * 2);
    assert.deepEqual(slowRoute, normalRoute);
    assert.equal(randomTurtleInterval(() => roll), 5000 + (10000 * roll));
  }
});

test('points the top of the turtle along horizontal, vertical, and diagonal trajectories', () => {
  assert.equal(calculateTurtleHeading({ x: 0, y: 0 }, { x: 10, y: 0 }), 90);
  assert.equal(calculateTurtleHeading({ x: 10, y: 0 }, { x: 0, y: 0 }), 270);
  assert.equal(calculateTurtleHeading({ x: 0, y: 0 }, { x: 10, y: 10 }), 135);
  assert.equal(calculateTurtleHeading({ x: 10, y: 10 }, { x: 0, y: 0 }), -45);
  assert.equal(calculateTurtleHeading({ x: 0, y: 0 }, { x: 0, y: 10 }), 180);
  assert.equal(calculateTurtleHeading({ x: 0, y: 10 }, { x: 0, y: 0 }), 0);
});

test('creates a complete left-to-right crossing between opposite vertical halves', () => {
  const values = [0, 0, 0.5, 0.25, 0.75];
  const journey = createTurtleJourney({
    containerHeight: 600,
    containerWidth: 1000,
    random: () => values.shift(),
    turtleHeight: 100,
    turtleWidth: 120,
  });

  assert.equal(journey.direction, 'left-to-right');
  assert.equal(journey.entryHalf, 'top');
  assert.equal(journey.exitHalf, 'bottom');
  assert.ok(journey.start.x < -120);
  assert.ok(journey.end.x > 1000);
  assert.ok(journey.start.y + 50 <= 300);
  assert.ok(journey.end.y + 50 >= 300);
  assert.ok(journey.duration >= 5000 && journey.duration <= 7000);
  assert.equal(journey.heading, calculateTurtleHeading(journey.start, journey.end));
});

test('creates a complete right-to-left crossing with a stable straight trajectory', () => {
  const values = [0.3, 1, 1, 0.8, 0.2];
  const journey = createTurtleJourney({
    containerHeight: 400,
    containerWidth: 320,
    random: () => values.shift(),
    turtleHeight: 80,
    turtleWidth: 90,
  });

  assert.equal(journey.direction, 'right-to-left');
  assert.equal(journey.entryHalf, 'bottom');
  assert.equal(journey.exitHalf, 'top');
  assert.ok(journey.start.x > 320);
  assert.ok(journey.end.x < -90);
  assert.ok(journey.start.y + 40 >= 200);
  assert.ok(journey.end.y + 40 <= 200);
  assert.equal(journey.duration, 7000);
  assert.equal(journey.heading, calculateTurtleHeading(journey.start, journey.end));
  assert.deepEqual(Object.keys(journey.start), ['x', 'y']);
  assert.deepEqual(Object.keys(journey.end), ['x', 'y']);
});

test('all four routes use opposite halves and clear the edge with the sprite rotated', () => {
  const width = 320;
  const height = 400;
  const turtleWidth = 90;
  const turtleHeight = 60;
  const samples = [
    [0, 'left-to-right', ['top', 'bottom']],
    [0.25, 'right-to-left', ['bottom', 'top']],
    [0.5, 'top-to-bottom', ['left', 'right']],
    [1, 'bottom-to-top', ['right', 'left']],
  ];

  for (const [index, [roll, direction, halves]] of samples.entries()) {
    const values = [roll, index % 2, 0.5, 0.1, 0.7];
    const pass = createTurtleJourney({
      containerWidth: width,
      containerHeight: height,
      turtleHeight,
      turtleWidth,
      random: () => values.shift(),
    });
    const vertical = index >= 2;
    const [near, far] = index % 2 ? [pass.end, pass.start] : [pass.start, pass.end];
    assert.equal(pass.direction, direction);
    assert.deepEqual([pass.entryHalf, pass.exitHalf], halves);
    assert.equal(pass.heading, calculateTurtleHeading(pass.start, pass.end));

    const crossCenter = (point) => vertical ? point.x + turtleWidth / 2 : point.y + turtleHeight / 2;
    const crossMidpoint = (vertical ? width : height) / 2;
    const crossesFarHalf = crossCenter(pass.start) > crossMidpoint;
    assert.equal(crossesFarHalf, Boolean(index % 2));
    assert.notEqual(crossesFarHalf, crossCenter(pass.end) > crossMidpoint);

    for (const wiggle of [-2, 0, 2]) {
      const angle = (pass.heading + wiggle) * Math.PI / 180;
      const cosine = Math.abs(Math.cos(angle));
      const sine = Math.abs(Math.sin(angle));
      const radius = vertical
        ? (turtleWidth * sine + turtleHeight * cosine) / 2
        : (turtleWidth * cosine + turtleHeight * sine) / 2;

      if (vertical) {
        assert.ok(near.y + turtleHeight / 2 + radius < 0);
        assert.ok(far.y + turtleHeight / 2 - radius > height);
      } else {
        assert.ok(near.x + turtleWidth / 2 + radius < 0);
        assert.ok(far.x + turtleWidth / 2 - radius > width);
      }
    }
  }
});

test('vertical routes match horizontal speed on short or tall layouts without clamping duration', () => {
  const distance = ({ start, end }) => Math.hypot(end.x - start.x, end.y - start.y);

  for (const [containerWidth, containerHeight] of [[1440, 240], [320, 1000]]) {
    const journey = (directionRoll) => {
      const rolls = [directionRoll, 0.25, 0.5, 0.85, 0.15];
      return createTurtleJourney({
        containerWidth,
        containerHeight,
        turtleWidth: 120,
        turtleHeight: 80,
        random: () => rolls.shift(),
        minDurationMs: 10000,
        maxDurationMs: 14000,
      });
    };
    const horizontal = journey(0.1);
    const vertical = journey(0.6);
    assert.equal(horizontal.duration, 12000);
    assert.ok(Math.abs(distance(vertical) / vertical.duration - distance(horizontal) / horizontal.duration) < 1e-10);
    assert.ok(containerWidth > containerHeight ? vertical.duration < 10000 : vertical.duration > 14000);
  }
});
