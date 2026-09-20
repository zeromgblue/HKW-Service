import "server-only";
import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import type { Ticket } from "@/types/ticket";

function toIso(value: Timestamp | null | undefined): string | null {
  return value ? value.toDate().toISOString() : null;
}

export function mapTicket(id: string, data: DocumentData): Ticket {
  return {
    ticketId: id,
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
    completedBy: data.completedBy ?? null,
    completionNote: data.completionNote ?? null,
  };
}
