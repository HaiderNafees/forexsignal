
'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

// This is a client-side only component that will listen for Firebase permission errors
// and throw them so that the Next.js development overlay can catch and display them.
// This component should be placed at the root of your layout.

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In a production environment, you might want to log this to a service
      // like Sentry, LogRocket, etc. For development, we throw it to get the
      // rich error overlay from Next.js.
      if (process.env.NODE_ENV === 'development') {
        // Throwing the error asynchronously to ensure it's caught by the boundary
        setTimeout(() => {
          throw error;
        }, 0);
      }
    };

    errorEmitter.on('permission-error', handleError);

    // No cleanup function is returned, so the listener persists
    // for the lifetime of the application.
  }, []);

  // This component renders nothing to the DOM.
  return null;
}
