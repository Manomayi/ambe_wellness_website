import ClientAuthProvider from "@/components/auth/ClientAuthProvider";
import "./globals.css";

export const metadata = {
  title: "Ambé Wellness | Holistic Tele-Wellness",
  description: "We care about your health and wellness by providing personalized support, expert guidance, and a comfortable environment designed to help you live your best life. Our mission is to promote a balanced lifestyle through quality care, wellness programs, and services tailored to your individual needs. Whether you are focusing on fitness, mental well-being, recovery, or overall health improvement, we are committed to supporting your journey every step of the way. We believe that true wellness comes from a combination of physical health, emotional balance, and positive daily habits. Our dedicated team works hard to create a welcoming experience where you feel valued, motivated, and empowered to achieve your goals. Through compassionate care, innovative solutions, and continuous support, we strive to make wellness accessible and sustainable for everyone. Your health is our priority, and we are here to help you build a healthier, happier, and more confident future.",
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
        </ClientAuthProvider>
      </body>
    </html>
  );
}
