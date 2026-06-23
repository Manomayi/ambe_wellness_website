import Link from "next/link";
import Navigation from "@/components/navigation/Navigation";
import Footer from "@/components/common/Footer";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site-config";

export const metadata = {
  title: "Download the App | Ambé Wellness",
  description:
    "Download the Ambé Wellness app for iOS and Android. Consultations, your wellness plan, and messaging with your integrative doctor — all in your pocket.",
  alternates: { canonical: "https://ambewellness.com/download" },
  openGraph: {
    title: "Download the App | Ambé Wellness",
    description:
      "Download the Ambé Wellness app for iOS and Android. Your wellness journey in your pocket.",
    url: "https://ambewellness.com/download",
    siteName: "Ambé Wellness",
    type: "website",
  },
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-32 pb-20 px-6" style={{ backgroundColor: "#F4F4F4" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#C2691C" }}
          >
            Get the App
          </p>
          <h1
            className="text-3xl sm:text-4xl font-medium mb-4"
            style={{ color: "#353535", fontFamily: "Richmond" }}
          >
            Your Wellness Journey in Your Pocket
          </h1>
          <p className="text-base mb-10" style={{ color: "#535353" }}>
            Consultations, your wellness plan, and messaging with your integrative
            doctor — all in the Ambé app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 rounded-full text-sm font-medium tracking-wider uppercase bg-[#353535] text-white hover:opacity-90"
            >
              Download on the App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 rounded-full text-sm font-medium tracking-wider uppercase border border-[#353535] text-[#353535] hover:bg-[#353535] hover:text-white"
            >
              Get it on Google Play
            </a>
          </div>
          <p className="mt-10 text-sm" style={{ color: "#535353" }}>
            Prefer the web?{" "}
            <Link href="/signup" className="underline" style={{ color: "#C2691C" }}>
              Book a free consult
            </Link>{" "}
            or{" "}
            <Link href="/membership" className="underline" style={{ color: "#C2691C" }}>
              view membership plans
            </Link>
            .
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
