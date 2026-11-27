import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MINIMUM_LOADING_MS = 3000;
const LOADING_FADE_MS = 500;

export default function useLoadingScreen(settled, {
  covered = false,
  initiallyComplete = false,
  minimumMs = MINIMUM_LOADING_MS,
} = {}) {
  const startedAt = useRef(null);
  const [stage, setStage] = useState(initiallyComplete ? 'complete' : 'loading');

  useLayoutEffect(() => {
    if (!covered) startedAt.current ??= performance.now();
  }, [covered]);

  useEffect(() => {
    if (!settled || stage === 'complete') return undefined;

    if (stage === 'fading') {
      const timeout = window.setTimeout(() => setStage('complete'), LOADING_FADE_MS);
      return () => window.clearTimeout(timeout);
    }

    const remaining = covered ? 0 : Math.max(0, minimumMs - (performance.now() - startedAt.current));
    const timeout = window.setTimeout(() => setStage(covered ? 'complete' : 'fading'), Math.ceil(remaining));
    return () => window.clearTimeout(timeout);
  }, [covered, minimumMs, settled, stage]);

  return stage;
}
