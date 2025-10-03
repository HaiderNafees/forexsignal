
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const setUserRole = functions.https.onCall(async (data, context) => {
  // Check if the user is an admin.
  if (context.auth?.token.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can set user roles."
    );
  }

  const { uid, role } = data;

  if (!uid || !["free", "pro", "admin"].includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid' and a valid 'role'."
    );
  }

  try {
    // Set custom claim for the user
    await admin.auth().setCustomUserClaims(uid, { role });

    // Update the role in the Firestore user document
    await db.collection("users").doc(uid).update({ role });

    return { message: `Success! User ${uid} has been made a ${role}.` };
  } catch (error) {
    console.error("Error setting user role:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while setting the user role."
    );
  }
});
