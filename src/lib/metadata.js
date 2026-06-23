import { SITE_URL } from "@/lib/site-config";

const DEFAULT_OG_IMAGE = `${SITE_URL}/images/logos/ambe_logo.png`;

export function buildPageMetadata({
  title,
  description,
  path = "",
  image = DEFAULT_OG_IMAGE,
}) {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Ambé Wellness",
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
