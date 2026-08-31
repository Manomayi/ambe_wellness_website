import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in the environment." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const amount = body.amount || 5000; // default $50.00 (5000 cents)
    const currency = (body.currency || "usd").toLowerCase();
    const { userId, appointmentTime, doctorId, doctorName, description } = body;

    const stripe = new Stripe(secretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency,
      payment_method_types: ["card"],
      description: description || "Consultation Deposit Fee",
      metadata: {
        type: "consultation_deposit",
        userId: userId || "",
        doctorId: doctorId || "",
        doctorName: doctorName || "",
        appointmentTime: appointmentTime ? String(appointmentTime) : "",
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
