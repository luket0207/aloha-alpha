import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import WordPressPage from './components/WordPressPage.jsx';
import './App.scss';

const pages = [
  { path: '/', slug: 'home' },
  { path: '/classes/', slug: 'classes' },
  { path: '/gallery/', slug: 'gallery' },
  { path: '/faqs/', slug: 'faqs' },
  { path: '/booking/', slug: 'booking' },
  { path: '/recruit/', slug: 'recruit' },
];

function NotFoundPage() {
  return <main className="container"><h1>Not found</h1></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {pages.map(({ path, slug }) => (
            <Route key={slug} path={path} element={<WordPressPage slug={slug} />} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
