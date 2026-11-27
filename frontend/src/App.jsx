import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ScrollManager from './components/ScrollManager.jsx';
import WordPressPage from './components/WordPressPage.jsx';
import { siteRoutes } from './siteRoutes.js';
import { isDemoMode } from './wordpressApi.js';
import './App.scss';

function NotFoundPage() {
  return <main className="container"><h1>Not found</h1></main>;
}

export default function App() {
  return (
    <BrowserRouter basename={isDemoMode ? import.meta.env.BASE_URL : undefined}>
      <ScrollManager />
      <Routes>
        <Route element={<Layout />}>
          {siteRoutes.map(({ path, slug }) => (
            <Route key={slug} path={path} element={<WordPressPage key={slug} slug={slug} />} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
