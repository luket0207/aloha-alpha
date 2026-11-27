const EMPTY_CLASS_DECORATIONS = Object.freeze({ palmTree: null, greenTurtle: null, surfboard: null });

export const EMPTY_SITE_ASSETS = Object.freeze({ turtle: null, classDecorations: EMPTY_CLASS_DECORATIONS });

function normalizeImageAsset(image) {
  if (!image || typeof image.url !== 'string' || !image.url.trim()) return null;

  const id = Number(image.id);
  const width = Number(image.width);
  const height = Number(image.height);

  return {
    id: Number.isInteger(id) && id > 0 ? id : null,
    url: image.url.trim(),
    width: Number.isFinite(width) && width > 0 ? width : null,
    height: Number.isFinite(height) && height > 0 ? height : null,
  };
}

export function normalizeSiteAssets(value) {
  const decorations = value?.classDecorations;
  return {
    turtle: normalizeImageAsset(value?.turtle),
    classDecorations: {
      palmTree: normalizeImageAsset(decorations?.palmTree),
      greenTurtle: normalizeImageAsset(decorations?.greenTurtle),
      surfboard: normalizeImageAsset(decorations?.surfboard),
    },
  };
}
