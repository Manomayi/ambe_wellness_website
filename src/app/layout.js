import ClientAuthProvider from "@/components/auth/ClientAuthProvider";
import "./globals.css";

export const metadata = {
  title: "Ambe Wellness",
  description: "We care about your health and wellness",
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
