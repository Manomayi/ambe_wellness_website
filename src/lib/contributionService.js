import { db } from "@/lib/firebase/config";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteField, 
  serverTimestamp, 
  Timestamp, 
  writeBatch 
} from "firebase/firestore";

/**
 * Records a contribution in Firestore across:
 * 1. Top-level `contributions` collection (for admin view and reporting)
 * 2. User subcollection `users/{uid}/contributions/{id}`
 * 3. User subcollection `users/{uid}/purchases/{id}`
 * 4. User profile `pending_contribution` flag if before_consultation
 */
export async function recordContribution({
  user,
  amount,
  type, // "before_consultation" | "after_consultation"
  paymentMethod, // "card" | "stripe" | "paypal" | "apple_pay"
  paymentId,
  consultationId = null,
  doctorUid = null,
  doctorName = null,
}) {
  if (!user || !user.uid) return false;

  const isBefore = type === "before_consultation";
  const waivedDeposit = isBefore && Number(amount) >= 20.0;
  const numAmount = Number(amount);

  const payload = {
    id: paymentId,
    userId: user.uid,
    userName: user.displayName || "Patient",
    userEmail: user.email || "",
    amount: numAmount,
    currency: "USD",
    type,
    status: "succeeded",
    paymentMethod,
    paymentId,
    waivedDeposit,
    isConsumed: !isBefore,
    ...(consultationId ? { consultationId } : {}),
    ...(doctorUid ? { doctorUid } : {}),
    ...(doctorName ? { doctorName } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 1. User records batch (guaranteed owned by user)
  const userBatch = writeBatch(db);

  // User subcollection
  const userContribRef = doc(db, "users", user.uid, "contributions", paymentId);
  userBatch.set(userContribRef, payload, { merge: true });

  // Update user document
  const userRef = doc(db, "users", user.uid);
  if (isBefore) {
    userBatch.set(
      userRef,
      {
        lastPaymentId: paymentId,
        pending_contribution: {
          id: paymentId,
          amount: numAmount,
          type: "before_consultation",
          waivedDeposit,
          paymentId,
          created_at: Timestamp.now(),
        },
      },
      { merge: true }
    );
  } else {
    userBatch.set(
      userRef,
      {
        lastPaymentId: paymentId,
      },
      { merge: true }
    );
  }

  await userBatch.commit();

  // 2. Top-level collection (for admin view and reporting)
  try {
    const topRef = doc(db, "contributions", paymentId);
    await setDoc(topRef, payload, { merge: true });
  } catch (e) {
    console.warn("Contribution: top-level collection write fallback:", e);
  }

  return true;
}

/**
 * Consumes the pending before_consultation contribution once an appointment is scheduled
 */
export async function consumePendingContribution(uid, consultationId) {
  if (!uid) return;

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return;

    const pending = userSnap.data()?.pending_contribution;
    if (pending) {
      const paymentId = pending.id || pending.paymentId;
      const batch = writeBatch(db);

      if (paymentId) {
        batch.set(
          doc(db, "users", uid, "contributions", paymentId),
          {
            isConsumed: true,
            consultationId: consultationId || "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      batch.update(doc(db, "users", uid), {
        pending_contribution: deleteField(),
      });

      await batch.commit();

      if (paymentId) {
        try {
          await setDoc(
            doc(db, "contributions", paymentId),
            {
              isConsumed: true,
              consultationId: consultationId || "",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("Contribution: consume top-level fallback:", e);
        }
      }
    }
  } catch (err) {
    console.error("Error consuming pending contribution:", err);
  }
}
