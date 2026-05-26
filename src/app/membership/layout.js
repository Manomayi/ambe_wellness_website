export const metadata = {
  title: 'Membership Plans | Ambé Wellness',
  description: 'Join Ambé Wellness for $50/month. Get unlimited doctor access, personalized Ayurvedic care, medicines included, and 1:1 video sessions. 3-month minimum commitment.',
  openGraph: {
    title: 'Membership Plans | Ambé Wellness',
    description: 'Join Ambé Wellness for $50/month. Unlimited doctor access, personalized Ayurvedic care, medicines included, and 1:1 video sessions.',
    url: 'https://ambewellness.com/membership',
    siteName: 'Ambé Wellness',
    images: [{ url: 'https://ambewellness.com/images/logos/ambe_logo.png', width: 1200, height: 630 }],
    type: 'website',
  },
  alternates: { canonical: 'https://ambewellness.com/membership' },
};

export default function MembershipLayout({ children }) {
  return children;
}
