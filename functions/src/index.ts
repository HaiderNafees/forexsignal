
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered on new user creation in Firebase Authentication.
 * Sets up the user document in Firestore and assigns a role.
 */
export const setupUserOnCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;
    
    // The one and only admin account
    const adminEmail = "admin@forexsignal.com";

    if (email === adminEmail) {
        // Assign 'admin' role and mark email as verified
        await admin.auth().setCustomUserClaims(uid, { role: "admin", pro: true });
        await admin.auth().updateUser(uid, { emailVerified: true });

        const adminUserDoc = {
            email: email,
            displayName: displayName || "Admin",
            role: "admin",
            proExpires: null, // Admins have permanent pro access
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("users").doc(uid).set(adminUserDoc);
        console.log(`Admin user created and configured: ${uid}`);

    } else {
        // Assign 'user' role for everyone else
        await admin.auth().setCustomUserClaims(uid, { role: "user", pro: false });

        const regularUserDoc = {
            email: email,
            displayName: displayName || "User",
            role: "user",
            proExpires: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("users").doc(uid).set(regularUserDoc);
        console.log(`User created and configured: ${uid}`);
    }
});


/**
 * Deletes the user's document from Firestore when they are deleted from Auth.
 */
export const cleanupUserOnDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  const userDocRef = db.collection("users").doc(uid);
  try {
    await userDocRef.delete();
    console.log(`Successfully deleted user data for ${uid} from Firestore.`);
  } catch (error) {
    console.error(`Error deleting user data for ${uid}:`, error);
  }
});

// Note: The verifyTrc20Payment function is omitted as it requires external API keys
// and a secure setup that cannot be managed here. The placeholder function demonstrates
// the required logic. You would need to add an API client (like axios or node-fetch)
// and secure your TronGrid API key using Firebase Functions configuration.
/**
 * Verifies a TRC20 USDT transaction and grants pro access if valid.
 * THIS IS A PLACEHOLDER and requires a real implementation with an API key.
 */
export const verifyTrc20Payment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a payment.");
    }

    const { txHash, price } = data;
    const { uid } = context.auth;
    const paymentDocRef = db.collection('payments').doc();
    
    // Placeholder for TronGrid API verification logic.
    // In a real scenario, you would use a library like 'axios' or 'node-fetch'
    // to call the TronGrid API with your API key.
    const isPaymentValid = true; // Replace with actual API call result
    const receivedAmount = 29; // Replace with actual amount from API

    if (isPaymentValid && receivedAmount >= price) {
        const proExpiryDate = new Date();
        proExpiryDate.setDate(proExpiryDate.getDate() + 30);

        await db.collection('users').doc(uid).update({
            proExpires: admin.firestore.Timestamp.fromDate(proExpiryDate)
        });

        await paymentDocRef.set({
            uid,
            txHash,
            amount: receivedAmount,
            status: 'verified',
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Set custom claim `pro` to true
        const currentClaims = context.auth.token || {};
        await admin.auth().setCustomUserClaims(uid, { ...currentClaims, pro: true });

        return { success: true, message: "Payment verified! Your account has been upgraded." };
    } else {
        await paymentDocRef.set({
            uid,
            txHash,
            amount: receivedAmount,
            status: 'rejected',
            verifiedAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        throw new functions.https.HttpsError("invalid-argument", "Payment could not be verified or amount was insufficient.");
    }
});
