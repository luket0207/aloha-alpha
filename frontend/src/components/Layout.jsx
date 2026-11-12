import { Outlet } from 'react-router-dom';
import ContactUs from './ContactUs.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import './Layout.scss';

export default function Layout() {
  return (
    <div className="site-layout">
      <Header />
      <div className="site-layout__content">
        <Outlet />
      </div>
      <ContactUs />
      <Footer />
    </div>
  );
}
