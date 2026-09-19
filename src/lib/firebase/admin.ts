import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function readPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  // .env files can't hold real newlines, so the key is stored with literal "\n".
  return raw?.replace(/\\n/g, "\n");
}

const adminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: readPrivateKey(),
};

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(adminConfig.projectId && adminConfig.clientEmail && adminConfig.privateKey);
}

let app: App | undefined;

function getAdminApp(): App {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin ยังไม่ได้ตั้งค่า กรุณาใส่ค่า FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY ใน .env.local",
    );
  }
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: adminConfig.projectId,
          clientEmail: adminConfig.clientEmail,
          privateKey: adminConfig.privateKey,
        }),
      });
  }
  return app;
}

let db: Firestore | undefined;

export function getAdminFirestore(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
  }
  return db;
}
