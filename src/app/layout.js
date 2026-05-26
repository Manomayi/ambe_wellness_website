import ClientAuthProvider from "@/components/auth/ClientAuthProvider";
import CookieBanner from "@/components/common/CookieBanner";
import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "Ambé Wellness | Holistic Tele-Wellness",
  description: "Real doctors trained in both modern science and traditional Vedic medicine. Personalized Ayurvedic care, 1:1 video sessions, unlimited messaging — all for $50/month.",
  openGraph: {
    title: "Ambé Wellness | Holistic Tele-Wellness",
    description: "Real doctors trained in both modern science and traditional Vedic medicine. Personalized care for $50/month.",
    url: "https://ambewellness.com",
    siteName: "Ambé Wellness",
    images: [{ url: "https://ambewellness.com/images/logos/ambe_logo.png", width: 1200, height: 630 }],
    type: "website",
  },
  alternates: { canonical: "https://ambewellness.com" },
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Script id="strip-extension-bis-attrs" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var attrs = ['bis_skin_checked', 'bis_register', 'bis_use'];
                var clean = function (root) {
                  var selectors = attrs.map(function (a) { return '[' + a + ']'; });
                  var nodes = (root || document).querySelectorAll(selectors.join(','));
                  for (var i = 0; i < nodes.length; i++) {
                    for (var j = 0; j < attrs.length; j++) {
                      nodes[i].removeAttribute(attrs[j]);
                    }
                  }
                };

                clean(document);

                var observer = new MutationObserver(function (mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (m.type === 'attributes' && attrs.indexOf(m.attributeName) !== -1 && m.target) {
                      m.target.removeAttribute(m.attributeName);
                    }
                    if (m.addedNodes && m.addedNodes.length) {
                      for (var k = 0; k < m.addedNodes.length; k++) {
                        var node = m.addedNodes[k];
                        if (node && node.nodeType === 1) clean(node);
                      }
                    }
                  }
                });

                observer.observe(document.documentElement, {
                  subtree: true,
                  childList: true,
                  attributes: true,
                  attributeFilter: attrs
                });

                setTimeout(function () {
                  observer.disconnect();
                }, 10000);
              } catch (e) {}
            })();
          `}
        </Script>
        <ClientAuthProvider>
          {children}
          <CookieBanner />
        </ClientAuthProvider>
      </body>
    </html>
  );
}
