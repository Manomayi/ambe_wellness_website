import ClientAuthProvider from "@/components/auth/ClientAuthProvider";
import CookieConsentBanner from "@/components/common/CookieConsentBanner";
import AyurvedaDisclaimerModal from "@/components/common/AyurvedaDisclaimerModal";
import "./globals.css";

export const metadata = {
  title: "Ambe Wellness",
  description: "We care about your health and wellness",
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
