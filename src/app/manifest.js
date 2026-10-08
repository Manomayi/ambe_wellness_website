// Web app manifest (served at /manifest.webmanifest; Next adds the <link> tag).
//
// Required for browser push on iPhone/iPad: iOS only allows web push for a site
// that has been added to the Home Screen and runs standalone.

export default function manifest() {
  return {
    id: '/',
    name: 'Ambé Wellness',
    short_name: 'Ambé',
    description: 'Holistic tele-wellness with integrative doctors trained in Ayurvedic medicine and modern science.',
    // ProtectedRoute sends doctors to /doctor/home and signed-out visitors to /login.
    start_url: '/user/home',
    scope: '/',
    display: 'standalone',
    background_color: '#1E1E1E',
    theme_color: '#1E1E1E',
    icons: [
      { src: '/images/app-icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/images/app-icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/images/app-icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
