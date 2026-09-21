import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const isTestMode = Boolean(body.isTestMode);

    const secretKey = isTestMode
      ? (process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || "").trim()
      : (process.env.STRIPE_SECRET_KEY || "").trim();

    if (!secretKey) {
      return NextResponse.json(
        { error: `Stripe secret key is not configured for ${isTestMode ? "test" : "live"} mode.` },
        { status: 500 }
      );
    }

    const amount = body.amount || 5000; // default $50.00 (5000 cents)
    const currency = (body.currency || "usd").toLowerCase();
    const { userId, appointmentTime, doctorId, doctorName, description, type } = body;

    const stripe = new Stripe(secretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency,
      payment_method_types: ["card"],
      description: description || (type === "store" ? "Store Product Purchase" : "Consultation Deposit Fee"),
      metadata: {
        type: type || "consultation_deposit",
        userId: userId || "",
        uid: userId || "",
        doctorId: doctorId || "",
        doctorName: doctorName || "",
        appointmentTime: appointmentTime ? String(appointmentTime) : "",
        tax_amount: body.tax_amount !== undefined && body.tax_amount !== null ? String(body.tax_amount) : "",
        shipping_amount: body.shipping_amount !== undefined && body.shipping_amount !== null ? String(body.shipping_amount) : "",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create payment intent." },
      { status: 500 }
    );
  }
}
