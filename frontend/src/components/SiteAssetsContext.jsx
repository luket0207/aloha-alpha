import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getWordPressRestUrl } from '../wordpressApi.js';
import { EMPTY_SITE_ASSETS, normalizeSiteAssets } from './siteAssets.js';

const SiteAssetsContext = createContext(EMPTY_SITE_ASSETS);

export function SiteAssetsProvider({ children }) {
  const [assets, setAssets] = useState(EMPTY_SITE_ASSETS);

  useEffect(() => {
    const controller = new AbortController();

    fetch(getWordPressRestUrl('aloha/v1/site-assets'), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`WordPress site assets error ${response.status}`);
        return response.json();
      })
      .then((value) => {
        if (!controller.signal.aborted) setAssets(normalizeSiteAssets(value));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setAssets(EMPTY_SITE_ASSETS);
      });

    return () => controller.abort();
  }, []);

  const value = useMemo(() => assets, [assets]);
  return <SiteAssetsContext.Provider value={value}>{children}</SiteAssetsContext.Provider>;
}

export function useSiteAssets() {
  return useContext(SiteAssetsContext);
}
