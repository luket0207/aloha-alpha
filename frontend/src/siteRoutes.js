export const siteRoutes = [
  { path: '/', slug: 'home' },
  { path: '/classes/', slug: 'classes', backToTop: true },
  { path: '/gallery/', slug: 'gallery' },
  { path: '/faqs/', slug: 'faqs' },
  { path: '/booking/', slug: 'booking' },
  { path: '/recruit/', slug: 'recruit' },
];

export const bookingPath = siteRoutes.find(({ slug }) => slug === 'booking').path;
