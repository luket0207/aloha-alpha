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

test('points the top of the turtle along horizontal and diagonal trajectories', () => {
  assert.equal(calculateTurtleHeading({ x: 0, y: 0 }, { x: 10, y: 0 }), 90);
  assert.equal(calculateTurtleHeading({ x: 10, y: 0 }, { x: 0, y: 0 }), 270);
  assert.equal(calculateTurtleHeading({ x: 0, y: 0 }, { x: 10, y: 10 }), 135);
  assert.equal(calculateTurtleHeading({ x: 10, y: 10 }, { x: 0, y: 0 }), -45);
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
  const values = [1, 1, 1, 0.8, 0.2];
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
