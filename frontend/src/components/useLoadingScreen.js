import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MINIMUM_LOADING_MS = 3000;
const LOADING_FADE_MS = 500;

export default function useLoadingScreen(settled, skipFade = false) {
  const startedAt = useRef(null);
  const [stage, setStage] = useState('loading');

  useLayoutEffect(() => {
    startedAt.current ??= performance.now();
  }, []);

  useEffect(() => {
    if (!settled || stage === 'complete') return undefined;

    if (stage === 'fading') {
      const timeout = window.setTimeout(() => setStage('complete'), LOADING_FADE_MS);
      return () => window.clearTimeout(timeout);
    }

    const remaining = Math.max(0, MINIMUM_LOADING_MS - (performance.now() - startedAt.current));
    const timeout = window.setTimeout(() => setStage(skipFade ? 'complete' : 'fading'), Math.ceil(remaining));
    return () => window.clearTimeout(timeout);
  }, [settled, skipFade, stage]);

  return stage;
}
