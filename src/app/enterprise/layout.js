import { buildPageMetadata } from "@/lib/metadata";
import "./enterprise.css";

export const metadata = buildPageMetadata({
  title: "Corporate Wellness Programs | Ambé Wellness",
  description:
    "Enterprise corporate wellness programs with measurable ROI — reduced absenteeism, improved retention, and tax-advantaged employee health benefits.",
  path: "/enterprise",
});

export default function EnterpriseLayout({ children }) {
  return children;
}
