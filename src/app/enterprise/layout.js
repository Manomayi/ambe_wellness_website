export const metadata = {
  title: 'Corporate Wellness Programs | Ambé Wellness',
  description: 'Bring Ambé Wellness to your company. Reduce absenteeism by 70%, improve retention scores by 80%. Integrative doctor-led corporate wellness programs for teams of all sizes.',
  openGraph: {
    title: 'Corporate Wellness Programs | Ambé Wellness',
    description: 'Bring Ambé Wellness to your company. Reduce absenteeism by 70%, improve retention by 80%. Doctor-led corporate wellness programs.',
    url: 'https://ambewellness.com/enterprise',
    siteName: 'Ambé Wellness',
    images: [{ url: 'https://ambewellness.com/images/logos/ambe_logo.png', width: 1200, height: 630 }],
    type: 'website',
  },
  alternates: { canonical: 'https://ambewellness.com/enterprise' },
};

export default function EnterpriseLayout({ children }) {
  return children;
}
