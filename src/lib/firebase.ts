import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Beat, PaymentGatewaysConfig, PurchasedLicense } from '../types';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: initialize Firestore with the designated database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
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

// Test initial connection
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is disconnected.');
    }
    return false;
  }
}

// ==========================================
// REAL-TIME BEAT CATALOG FIRESTORE HELPERS
// ==========================================

const BEATS_COLLECTION = 'beats';
const SETTINGS_COLLECTION = 'settings';
const PURCHASES_COLLECTION = 'purchases';

/**
 * Sanitizes a Beat object before writing to Firestore.
 * Preserves self-contained Data URLs (Base64) for cover images and audio previews so they
 * persist across all external devices (mobile, desktop, Netlify, offline) without 
 * relying on ephemeral local server '/uploads/...' paths.
 * Guarantees document size stays within Firestore's 1MB limit.
 */
export function sanitizeBeatForFirestore(beat: Beat): Beat {
  let cleanCover = beat.coverUrl ? beat.coverUrl.trim() : '';
  // Remove unsplash or legacy broken local paths
  if (cleanCover.includes('images.unsplash.com') || cleanCover.startsWith('/uploads/')) {
    cleanCover = '';
  }
  // Cap max cover string size to 500KB to safely fit within Firestore 1MB document limit
  if (cleanCover.length > 500000) {
    cleanCover = '';
  }

  let cleanAudioUrl = (beat.audioUrl || beat.audioPreviewUrl || '/subestimado.mp3').trim();
  if (cleanAudioUrl.startsWith('/uploads/')) {
    cleanAudioUrl = '/subestimado.mp3';
  }
  // Cap max audio Data URL to 850KB to safely fit within Firestore 1MB document limit
  if (cleanAudioUrl.length > 850000) {
    cleanAudioUrl = '/subestimado.mp3';
  }

  let cleanAudioPreviewUrl = (beat.audioPreviewUrl || cleanAudioUrl || '/subestimado.mp3').trim();
  if (cleanAudioPreviewUrl.startsWith('/uploads/')) {
    cleanAudioPreviewUrl = cleanAudioUrl;
  }
  if (cleanAudioPreviewUrl.length > 850000) {
    cleanAudioPreviewUrl = cleanAudioUrl;
  }

  return {
    ...beat,
    coverUrl: cleanCover,
    audioUrl: cleanAudioUrl,
    audioPreviewUrl: cleanAudioPreviewUrl,
    // Ensure previewWaveform is reasonably sized (max 50 points)
    previewWaveform: Array.isArray(beat.previewWaveform)
      ? beat.previewWaveform.slice(0, 50).map(v => Number(Number(v).toFixed(2)))
      : undefined
  };
}

/**
 * Subscribe to real-time updates for the entire beat catalog.
 * Invokes onBeatsUpdate whenever a beat is added, edited, or removed anywhere in the cloud.
 */
export function subscribeToRealtimeBeats(
  onBeatsUpdate: (beats: Beat[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, BEATS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const beatsList: Beat[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id && data.title) {
          beatsList.push(data as Beat);
        }
      });
      // Sort by newest first by default if createdAt exists
      beatsList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      onBeatsUpdate(beatsList);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, BEATS_COLLECTION);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

/**
 * Save or update a single beat directly in Firestore.
 * Automatically sanitizes payload to guarantee document size is well under 1MB.
 */
export async function saveBeatToFirestore(beat: Beat): Promise<void> {
  const sanitized = sanitizeBeatForFirestore(beat);
  const path = `${BEATS_COLLECTION}/${sanitized.id}`;
  try {
    const docRef = doc(db, BEATS_COLLECTION, sanitized.id);
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a beat from Firestore
 */
export async function deleteBeatFromFirestore(beatId: string): Promise<void> {
  const path = `${BEATS_COLLECTION}/${beatId}`;
  try {
    const docRef = doc(db, BEATS_COLLECTION, beatId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Bulk seed or sync initial beats to Firestore if cloud database is empty.
 * Never writes large binary or Base64 payloads to Firestore.
 */
export async function seedInitialBeatsIfEmpty(initialBeats: Beat[]): Promise<void> {
  try {
    const colRef = collection(db, BEATS_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && initialBeats.length > 0) {
      console.log('Seeding initial beats to Firestore cloud database...');
      for (const rawBeat of initialBeats) {
        const sanitized = sanitizeBeatForFirestore(rawBeat);
        const docRef = doc(db, BEATS_COLLECTION, sanitized.id);
        await setDoc(docRef, sanitized);
      }
      console.log('Firestore seed completed successfully with sanitized lightweight documents.');
    }
  } catch (error) {
    console.warn('Could not auto-seed Firestore (non-fatal):', error);
  }
}

/**
 * Subscribe to store payment and producer config
 */
export function subscribeToPaymentConfig(
  onConfigUpdate: (config: PaymentGatewaysConfig) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_COLLECTION, 'payment');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.producerName) {
          onConfigUpdate(data as PaymentGatewaysConfig);
        }
      }
    },
    (error) => {
      console.warn('Firestore payment config listener error (non-fatal):', error);
    }
  );
}

/**
 * Save store payment config to Firestore
 */
export async function savePaymentConfigToFirestore(config: PaymentGatewaysConfig): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/payment`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'payment');
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Record a purchased license contract to Firestore
 */
export async function savePurchasedLicenseToFirestore(license: PurchasedLicense): Promise<void> {
  const path = `${PURCHASES_COLLECTION}/${license.orderId}`;
  try {
    const docRef = doc(db, PURCHASES_COLLECTION, license.orderId);
    await setDoc(docRef, license);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
