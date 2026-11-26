const FOOTER_COLOURS = ['light-blue', 'dark-blue', 'green'];

export function footerColourClass(value) {
  return `theme-${FOOTER_COLOURS.includes(value) ? value : 'light-blue'}`;
}
