import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// On user creation, set their role and create a user document in Firestore.
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;
  
  // Hardcode the admin role for the specified email.
  const role = email === "admin@forexsignal.com" ? "admin" : "free";

  const userRef = db.collection("users").doc(uid);

  await userRef.set({
    uid,
    email,
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    proExpires: null,
  });

  if (role === 'admin') {
     await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  } else {
     await admin.auth().setCustomUserClaims(uid, { role: 'free' });
  }

  // Re-fetch the user to allow claims to propagate.
  await admin.auth().getUser(uid);
});

// Cloud function to verify a payment and upgrade a user to pro.
export const verifyPaymentAndUpgrade = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { txHash } = data;
    const { uid } = context.auth;
    const amount = 60; // Pro plan price

    // --- Placeholder for TRC-20 verification ---
    // In a real application, you would use an API like TronGrid to verify the transaction hash (txHash).
    // For this example, we will assume the payment is valid if a txHash is provided.
    const isPaymentValid = !!txHash; 
    
    if (!isPaymentValid) {
        throw new functions.https.HttpsError('invalid-argument', 'The transaction hash is invalid or could not be verified.');
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const proExpiryDate = new Date();
        proExpiryDate.setDate(proExpiryDate.getDate() + 30); // 30-day pro access

        // Update user's role and pro expiry
        await userRef.update({
            role: 'pro',
            proExpires: admin.firestore.Timestamp.fromDate(proExpiryDate)
        });

        // Set custom claim for role-based access
        await admin.auth().setCustomUserClaims(uid, { role: 'pro' });

        // Create a payment record
        await db.collection('payments').add({
            userId: uid,
            amount,
            txHash,
            verified: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'Your account has been upgraded to Pro for 30 days.' };

    } catch (error) {
        console.error("Payment verification failed:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while upgrading your account.');
    }
});


// Scheduled function to downgrade expired pro users
export const downgradeExpiredProUsers = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const query = db.collection('users').where('role', '==', 'pro').where('proExpires', '<=', now);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
        console.log("No expired pro users to downgrade.");
        return null;
    }

    const batch = db.batch();
    
    snapshot.forEach(async (doc) => {
        console.log(`Downgrading user ${doc.id}`);
        const userRef = db.collection('users').doc(doc.id);
        batch.update(userRef, { role: 'free', proExpires: null });
        // Also update custom claims
        await admin.auth().setCustomUserClaims(doc.id, { role: 'free' });
    });

    await batch.commit();
    return null;
});
