import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getProductById } from "@/lib/shop/products";

// POST /api/checkout
// Body: { productId: string }
//
// Creates a one-time Stripe Checkout Session for a single product using the
// product's EXISTING Stripe Price ID (no new Stripe products are created), then
// returns the hosted Checkout URL for the client to redirect to.
//
// Requires STRIPE_SECRET_KEY in the environment (the SAME secret key the app
// already uses). Only the publishable key is wired today, so add the secret
// key to .env before this can complete a live checkout.
export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in the environment." },
      { status: 500 }
    );
  }

  let productId;
  try {
    ({ productId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!productId) {
    return NextResponse.json({ error: "Missing productId." }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product || !product.stripePriceId) {
    return NextResponse.json(
      { error: "Product not found or has no Stripe price." },
      { status: 404 }
    );
  }

  // Resolve the site origin so success/cancel URLs work in any environment.
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://ambewellness.com";

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 }
    );
  }
}
