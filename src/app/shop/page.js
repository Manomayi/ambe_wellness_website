import Link from "next/link";
import ShopHeader from "@/components/shop/ShopHeader";
import CredentialsTicker from "@/components/shop/CredentialsTicker";
import ShopClient from "@/components/shop/ShopClient";
import { getProducts } from "@/lib/shop/products";
import { CONSULT_HREF } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/metadata";
import "./shop.css";

export const metadata = buildPageMetadata({
  title: "Shop | Ambé Wellness",
  description:
    "Doctor-curated Ayurvedic formulas, herbal supplements, and wellness essentials. Order directly and ship to your door — no consultation required.",
  path: "/shop",
});

const HERO_BADGES = [
  "GMP Certified",
  "80+ Years of Legacy",
  "GMO Free",
  "Ships from the US",
  "Prop 65 Compliant",
];

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="shop-page min-h-screen">
      <ShopHeader />

      <div className="shop-hero">
        <div className="shop-wrap">
          <div className="shop-hero-inner">
            <div>
              <div className="shop-eyebrow">Ambé Wellness Shop</div>
              <h1>
                Remedies <em>made for you.</em>
              </h1>
              <p className="shop-hero-sub">
                Doctor-curated Ayurvedic formulas, herbal supplements, and wellness essentials.
                No consultation required — order directly and ship to your door.
              </p>
            </div>
            <div className="shop-trust">
              {HERO_BADGES.map((b) => (
                <div key={b} className="shop-trust-item">
                  <span>✦</span> {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CredentialsTicker />

      <ShopClient products={products} />

      <footer className="shop-footer">
        <div className="shop-wrap">
          <p>
            These statements have not been evaluated by the Food and Drug Administration. Products
            sold on this page are not intended to diagnose, treat, cure, or prevent any disease.
            All Ambé Wellness products are sourced from Kerala Ayurveda, a GMP-certified
            manufacturer with 80+ years of Ayurvedic legacy, producing 350+ classical and
            proprietary herbal formulations. Products are GMO-free, Prop 65 compliant,
            sustainably and ethically sourced, and meet ISO 22000 and European Pharmacopoeia
            quality benchmarks. Third-party tested for purity, potency, microbial safety, heavy
            metals, and pesticides. For personalized guidance on which products are right for your
            constitution,{" "}
            <Link href={CONSULT_HREF}>book a free consultation</Link> with an Ambé doctor.
          </p>
        </div>
      </footer>
    </div>
  );
}
