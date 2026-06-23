import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Membership Plans | Ambé Wellness",
  description:
    "Flexible membership from $50/month with a 3-month minimum. Includes consultations, medicines, unlimited messaging, and personalized Ayurvedic wellness protocols.",
  path: "/membership",
});

export default function MembershipLayout({ children }) {
  return children;
}
