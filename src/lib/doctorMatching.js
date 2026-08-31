import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

/**
 * Health field labels and keys mapping
 */
export const HEALTH_FIELD_MAP = {
  general: "general_health",
  general_health: "general_health",
  womens_health: "womens_health",
  mens_health: "mens_health",
  muscular_skeletal: "muscular_skeletal",
  heart_health: "heart_health",
  skin_hair: "skin_hair_health",
  skin_hair_health: "skin_hair_health",
  mental_emotional: "mental_emotional_health",
  mental_emotional_health: "mental_emotional_health",
  digestive_metabolic: "digestive_metabolic",
  oncology: "oncology",
  disabilities: "disabilities",
  behavorial: "behavorial",
};

/**
 * Normalizes specialty key to standard format
 */
export function normalizeHealthField(fieldKey) {
  if (!fieldKey) return "general_health";
  return HEALTH_FIELD_MAP[fieldKey] || fieldKey;
}

/**
 * Matches a user with a doctor based on specialty or instant availability.
 * If no matching doctor is found, sets `needs_doctor_assignment: true` for manual admin assignment.
 * 
 * @param {string} userId - User UID
 * @param {string} preferredField - Selected specialty/health concern key
 * @param {boolean} isInstantRequest - Whether to prioritize doctors available right now
 * @returns {Promise<{ matched: boolean, doctor: object|null, message: string }>}
 */
export async function matchUserWithDoctor(userId, preferredField = "general_health", isInstantRequest = false) {
  if (!userId) {
    return { matched: false, doctor: null, message: "User ID is required." };
  }

  const normalizedField = normalizeHealthField(preferredField);

  try {
    const doctorsRef = collection(db, "doctors");
    let matchedDoc = null;

    // 1. If instant match is requested, check doctors with `is_available_now: true`
    if (isInstantRequest) {
      const instantSnap = await getDocs(
        query(doctorsRef, where("is_available_now", "==", true))
      );
      if (!instantSnap.empty) {
        // Look for matching specialty first among instant doctors
        const matchInInstant = instantSnap.docs.find(d => {
          const fields = d.data().field || [];
          return fields.includes(normalizedField) || fields.includes(preferredField);
        });
        matchedDoc = matchInInstant || instantSnap.docs[0];
      }
    }

    // 2. Specialty matching if not already matched
    if (!matchedDoc && normalizedField) {
      // Query doctors with field array containing normalizedField
      const specialtySnap = await getDocs(
        query(doctorsRef, where("field", "array-contains", normalizedField))
      );
      if (!specialtySnap.empty) {
        // Prefer verified doctors
        const verifiedDoctor = specialtySnap.docs.find(d => d.data().verified === true || d.data().is_verified === true);
        matchedDoc = verifiedDoctor || specialtySnap.docs[0];
      } else if (preferredField !== normalizedField) {
        const altSnap = await getDocs(
          query(doctorsRef, where("field", "array-contains", preferredField))
        );
        if (!altSnap.empty) {
          const verifiedDoctor = altSnap.docs.find(d => d.data().verified === true || d.data().is_verified === true);
          matchedDoc = verifiedDoctor || altSnap.docs[0];
        }
      }
    }

    // 3. Fallback to general health if specific specialty had no doctor
    if (!matchedDoc && normalizedField !== "general_health") {
      const generalSnap = await getDocs(
        query(doctorsRef, where("field", "array-contains", "general_health"))
      );
      if (!generalSnap.empty) {
        const verifiedGeneral = generalSnap.docs.find(d => d.data().verified === true || d.data().is_verified === true);
        matchedDoc = verifiedGeneral || generalSnap.docs[0];
      }
    }

    // If still no doctor found -> Flag user as needing admin assignment
    if (!matchedDoc) {
      await updateDoc(doc(db, "users", userId), {
        needs_doctor_assignment: true,
        preferred_health: normalizedField,
      }).catch(() => {});

      return {
        matched: false,
        doctor: null,
        message: "We are currently looking for the best doctor specializing in your selected topic for you. You will be notified as soon as a doctor is assigned."
      };
    }

    // Doctor found -> Assign to user
    const doctorData = matchedDoc.data();
    const doctorId = matchedDoc.id;
    const doctorName = `Dr. ${doctorData.first_name || ""} ${doctorData.last_name || ""}`.trim();

    const doctorObject = {
      uid: doctorId,
      first_name: doctorData.first_name || "",
      last_name: doctorData.last_name || "",
      title: doctorData.title || doctorData.professional_title || "Healthcare Provider",
      field: doctorData.field || [normalizedField],
      profile_picture: doctorData.profile_picture || "",
      email: doctorData.email || "",
      is_available_now: Boolean(doctorData.is_available_now),
      is_schedule_set: Boolean(doctorData.is_schedule_set),
    };

    // Update user document
    await updateDoc(doc(db, "users", userId), {
      doctor: doctorObject,
      doctor_uid: doctorId,
      doctor_id: doctorId,
      doctor_name: doctorName,
      needs_doctor_assignment: false,
      preferred_health: normalizedField,
    });

    // Add user to doctor's users subcollection
    const userDoc = await getDoc(doc(db, "users", userId));
    const uData = userDoc.exists() ? userDoc.data() : {};
    const userFullName = `${uData.first_name || ""} ${uData.last_name || ""}`.trim() || "Patient";

    await setDoc(doc(db, "doctors", doctorId, "users", userId), {
      uid: userId,
      user_uid: userId,
      name: userFullName,
      user_name: userFullName,
      user_email: uData.email || "",
      profile_picture: uData.profile_picture || "",
      health_field: normalizedField,
      matched_at: serverTimestamp(),
    }, { merge: true }).catch(() => {});

    return {
      matched: true,
      doctor: doctorObject,
      message: "Doctor matched successfully!"
    };
  } catch (error) {
    console.error("Error in matchUserWithDoctor:", error);
    return {
      matched: false,
      doctor: null,
      message: "Could not complete matching at this moment."
    };
  }
}
