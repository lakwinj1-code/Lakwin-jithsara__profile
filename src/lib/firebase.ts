import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  Firestore,
  FirestoreSettings,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Prevent internal WebChannel 10s retry notices on slow/VPN networks from surfacing as uncaught console.error crashes
setLogLevel('silent');

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  try {
    const settings: FirestoreSettings & { useFetchStreams?: boolean } = {
      experimentalForceLongPolling: true,
      experimentalLongPollingOptions: {
        timeoutSeconds: 8,
      },
      useFetchStreams: false,
    };
    return initializeFirestore(
      app,
      settings,
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const SITE_OWNER_EMAIL = 'lakwinj1@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function probeFirestoreConfigStatus(): Promise<number> {
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        firebaseConfig.projectId
      )}/databases/${encodeURIComponent(
        firebaseConfig.firestoreDatabaseId
      )}/documents/profiles/main?key=${encodeURIComponent(
        firebaseConfig.apiKey
      )}`;
      xhr.open('GET', url, true);
      xhr.timeout = 6000;
      xhr.onload = () => resolve(xhr.status);
      xhr.onerror = () => resolve(0);
      xhr.ontimeout = () => resolve(0);
      xhr.send();
    } catch {
      resolve(0);
    }
  });
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'profiles', 'main'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      try {
        await getDocFromServer(doc(db, 'profiles', 'main'));
      } catch (retryError) {
        if (
          retryError instanceof Error &&
          retryError.message.includes('the client is offline')
        ) {
          const httpStatus = await probeFirestoreConfigStatus();
          if (httpStatus === 400 || httpStatus === 404) {
            console.error('Please check your Firebase configuration.');
          }
        }
      }
    }
  }
}

void testConnection();

export function createSafeDocId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
}
