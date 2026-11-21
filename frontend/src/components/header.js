export const DEFAULT_HEADER_COLOUR = 'dark-green';

export const HEADER_COLOURS = [
  DEFAULT_HEADER_COLOUR,
  'green',
  'dark-blue',
];

export function normalizeHeaderColour(value) {
  return HEADER_COLOURS.includes(value) ? value : DEFAULT_HEADER_COLOUR;
}

export function headerColourClass(value) {
  return `aloha-header--${normalizeHeaderColour(value)}`;
}
