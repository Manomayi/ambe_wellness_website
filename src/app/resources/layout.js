import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Resources & Wellness Guides | Ambé Wellness",
  description:
    "Free expert wellness guides on food, body care, detox, Ayurveda, and integrative living. Ancient wisdom for modern living — curated by integrative doctors.",
  path: "/resources",
});

export default function ResourcesLayout({ children }) {
  return children;
}
