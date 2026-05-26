export const metadata = {
  title: 'Resources & Wellness Guides | Ambé Wellness',
  description: 'Free Ayurvedic wellness guides, expert resources, and educational content. Download guides on hormone health, nutrition, and holistic living from Ambé Wellness.',
  openGraph: {
    title: 'Resources & Wellness Guides | Ambé Wellness',
    description: 'Free Ayurvedic wellness guides and expert resources. Download guides on hormone health, nutrition, and holistic living.',
    url: 'https://ambewellness.com/resources',
    siteName: 'Ambé Wellness',
    images: [{ url: 'https://ambewellness.com/images/logos/ambe_logo.png', width: 1200, height: 630 }],
    type: 'website',
  },
  alternates: { canonical: 'https://ambewellness.com/resources' },
};

export default function ResourcesLayout({ children }) {
  return children;
}
