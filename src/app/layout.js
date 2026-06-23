import ClientAuthProvider from "@/components/auth/ClientAuthProvider";
import CookieConsentBanner from "@/components/common/CookieConsentBanner";
import AyurvedaDisclaimerModal from "@/components/common/AyurvedaDisclaimerModal";
import { buildPageMetadata } from "@/lib/metadata";
import "./globals.css";

export const metadata = {
  ...buildPageMetadata({
    title: "Ambé Wellness | Holistic Tele-Wellness",
    description:
      "Holistic tele-wellness with integrative doctors trained in Ayurvedic medicine and modern science. Membership from $50/month — consultations, medicines, and messaging included.",
    path: "/",
  }),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/images/favicons/leaf.png",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientAuthProvider>
          {children}
          <AyurvedaDisclaimerModal />
          <CookieConsentBanner />
        </ClientAuthProvider>
      </body>
    </html>
  );
}
