import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Resources & Wellness Guides | Ambé Wellness",
  description:
    "Free expert wellness guides on home detox, nutrition, mind-body health, and Ayurvedic living. Download guides and explore our Q&A library.",
  path: "/resources",
});

export default function ResourcesLayout({ children }) {
  return children;
}
