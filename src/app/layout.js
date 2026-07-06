import ClientAuthProvider from "@/components/auth/ClientAuthProvider";
import CookieConsentBanner from "@/components/common/CookieConsentBanner";
import AyurvedaDisclaimerModal from "@/components/common/AyurvedaDisclaimerModal";
import { buildPageMetadata } from "@/lib/metadata";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

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
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${cormorant.variable}`}
    >
      <body className={`${jost.className} antialiased`}>
        <ClientAuthProvider>
          {children}
          <AyurvedaDisclaimerModal />
          <CookieConsentBanner />
        </ClientAuthProvider>
      </body>
    </html>
  );
}
