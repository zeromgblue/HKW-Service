import "server-only";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { TicketImage } from "@/types/ticket";

export async function getTicketImages(ticketId: string): Promise<TicketImage[]> {
  if (!isFirebaseAdminConfigured() || !ticketId) return [];

  const db = getAdminFirestore();
  const snap = await db
    .collection("ticket_images")
    .where("ticketId", "==", ticketId)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      imageId: doc.id,
      ticketId: data.ticketId,
      type: data.type,
      storagePath: data.storagePath,
      downloadUrl: data.downloadUrl,
      uploadedBy: data.uploadedBy,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
    };
  });
}
