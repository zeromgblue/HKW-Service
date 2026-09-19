import "server-only";
import type { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { Ticket } from "@/types/ticket";

function toIso(value: Timestamp | null | undefined): string | null {
  return value ? value.toDate().toISOString() : null;
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  if (!isFirebaseAdminConfigured() || !ticketId) return null;

  const db = getAdminFirestore();
  const snap = await db.collection("tickets").doc(ticketId).get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    ticketId: snap.id,
    categoryId: data.categoryId,
    categoryNameSnapshot: data.categoryNameSnapshot,
    locationText: data.locationText,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    accuracyMeters: data.accuracyMeters ?? null,
    locationCapturedAt: toIso(data.locationCapturedAt),
    locationSource: data.locationSource ?? null,
    originalLatitude: data.originalLatitude ?? null,
    originalLongitude: data.originalLongitude ?? null,
    originalAccuracyMeters: data.originalAccuracyMeters ?? null,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: data.status,
    reporterType: data.reporterType,
    reporterName: data.reporterName ?? null,
    reporterContact: data.reporterContact ?? null,
    isAnonymous: Boolean(data.isAnonymous),
    assignedTo: data.assignedTo ?? null,
    createdAt: toIso(data.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(data.updatedAt) ?? new Date(0).toISOString(),
    completedAt: toIso(data.completedAt),
    completionNote: data.completionNote ?? null,
  };
}
