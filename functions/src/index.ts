
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const setUserRoleOnCreate = functions.firestore
  .document("users/{uid}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const { uid } = context.params;

    // Automatically assign 'admin' role to the specified email
    if (userData.email === "forexsignaldmn@gmail.com") {
      try {
        await admin.auth().setCustomUserClaims(uid, { role: "admin" });
        await snap.ref.update({ role: "admin" });
        // Mark email as verified for the admin user
        await admin.auth().updateUser(uid, { emailVerified: true });
        console.log(`Admin role and email verification set for ${uid}`);
      } catch (error) {
        console.error(`Error setting admin role for ${uid}:`, error);
      }
      return;
    }
    
    // For all other users, default to 'free' role
    const role = userData.role || "free";

    try {
      await admin.auth().setCustomUserClaims(uid, { role });
      console.log(`Custom claim set for ${uid}: role=${role}`);
    } catch (error) {
      console.error(`Error setting custom claim for ${uid}:`, error);
    }
  });


export const setUserRoleOnUpdate = functions.firestore
  .document("users/{uid}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const { uid } = context.params;

    // Check if the role has changed
    if (newValue.role !== previousValue.role) {
       try {
        // Set custom claim
        await admin.auth().setCustomUserClaims(uid, { role: newValue.role });
        console.log(`Custom claim updated for ${uid}: role=${newValue.role}`);
       } catch (error) {
        console.error(`Error updating custom claim for ${uid}:`, error);
       }
    }
  });


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
    // Update the role in the Firestore user document. This will trigger the onUpdate function
    // to set the custom claim.
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
