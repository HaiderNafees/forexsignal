
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const setUserRoleOnCreate = functions.firestore
  .document("users/{uid}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const { uid } = context.params;

    // Automatically assign 'admin' role and verify email for the specified admin user
    if (userData.email === "forexsignaldmn@gmail.com") {
      try {
        // Set role via custom claims
        await admin.auth().setCustomUserClaims(uid, { role: "admin" });
        // Update role in Firestore document for consistency
        await snap.ref.update({ role: "admin" });
        // Mark email as verified on the backend
        await admin.auth().updateUser(uid, { emailVerified: true });
        console.log(`Admin role and email verification set for ${uid}`);
      } catch (error) {
        console.error(`Error setting admin role for ${uid}:`, error);
      }
      return; // Stop execution for the admin user
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


export const deleteUser = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can delete users."
    );
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid'."
    );
  }

  try {
    // Deleting the user from Firebase Authentication will trigger the `onUserDeleted` function
    await admin.auth().deleteUser(uid);
    return { message: `Successfully deleted user ${uid}` };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
        // If user not in Auth, maybe just delete from firestore
        await db.collection("users").doc(uid).delete();
        return { message: `User ${uid} not found in Auth, deleted from Firestore.` };
    }
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while deleting the user."
    );
  }
});

// Trigger to clean up user data in Firestore when a user is deleted from Auth
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  const userDocRef = db.collection("users").doc(uid);
  try {
    await userDocRef.delete();
    console.log(`Successfully deleted user data for ${uid} from Firestore.`);
  } catch (error) {
    console.error(`Error deleting user data for ${uid}:`, error);
  }
});
