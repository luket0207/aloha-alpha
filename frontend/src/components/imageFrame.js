export const ROUND_FRAME_PATH = 'M.5 .015C.75 .005 .955 .19 .985 .43C1 .68 .83 .9 .59 .975C.35 1 .12 .88 .045 .67C-.01 .48 .055 .28 .22 .145C.31 .07 .4 .025 .5 .015Z';

export const SQUARE_FRAME_PATH = 'M.035 .08C.19 .02 .36 .07 .515 .04C.68 .01 .84 .065 .965 .035C.995 .22 .955 .39 .985 .565C1 .72 .96 .865 .92 .965C.74 .94 .57 .995 .405 .97C.245 .945 .105 .99 .035 .92C.06 .74 .015 .57 .045 .405C.075 .255 .01 .15 .035 .08Z';

export function normalizeFrameType(frameType) {
  return frameType === 'square' ? 'square' : 'round';
}

export function createRoundFrameAngle(random = Math.random) {
  return Math.floor(random() * 360);
}

export function imageFrameDataFromElement(element) {
  const image = element.querySelector(':scope > img, :scope .aloha-image-frame__image');
  if (!image?.getAttribute('src')) return null;

  const frameType = normalizeFrameType(element.dataset.frameType
    || (element.classList.contains('aloha-image-frame--square') ? 'square' : 'round'));

  return {
    frameType,
    image: {
      alt: image.getAttribute('alt') || '',
      className: image.getAttribute('class') || undefined,
      decoding: image.getAttribute('decoding') || 'async',
      height: image.getAttribute('height') || undefined,
      loading: image.getAttribute('loading') || 'lazy',
      sizes: image.getAttribute('sizes') || undefined,
      src: image.getAttribute('src'),
      srcSet: image.getAttribute('srcset') || undefined,
      width: image.getAttribute('width') || undefined,
    },
  };
}
