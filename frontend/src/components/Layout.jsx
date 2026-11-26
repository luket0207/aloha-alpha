import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ContactUs from './ContactUs.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import { SiteAssetsProvider } from './SiteAssetsContext.jsx';
import useLoadingScreen from './useLoadingScreen.js';
import './Layout.scss';

export default function Layout() {
  const [navigationSettled, setNavigationSettled] = useState(false);
  const navigationStage = useLoadingScreen(navigationSettled);
  const showOverlay = navigationStage !== 'complete';

  return (
    <SiteAssetsProvider>
      {showOverlay && <LoadingScreen fading={navigationStage === 'fading'} variant="navigation" />}
      <div className="site-layout" inert={showOverlay}>
        <Header onNavigationSettled={setNavigationSettled} />
        <div className="site-layout__content">
          <Outlet context={showOverlay} />
        </div>
        <ContactUs />
        <Footer />
      </div>
    </SiteAssetsProvider>
  );
}
