export type TicketPriority = "normal" | "urgent" | "critical";

export type TicketStatus = "pending" | "completed";

export type ReporterType = "teacher" | "staff";

export type LocationSource = "device_gps" | "manual_pin";

export interface Ticket {
  ticketId: string;
  categoryId: string;
  categoryNameSnapshot: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  locationCapturedAt: string | null;
  locationSource: LocationSource | null;
  originalLatitude: number | null;
  originalLongitude: number | null;
  originalAccuracyMeters: number | null;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  reporterType: ReporterType;
  reporterName: string | null;
  reporterContact: string | null;
  isAnonymous: boolean;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completedBy: string | null;
  completionNote: string | null;
}

export type CategoryIconName =
  | "zap"
  | "droplet"
  | "snowflake"
  | "laptop"
  | "armchair"
  | "building"
  | "shield-alert"
  | "more-horizontal";

export interface Category {
  categoryId: string;
  name: string;
  icon: CategoryIconName;
  active: boolean;
  sortOrder: number;
}

export type TicketImageType = "before" | "after";

export interface TicketImage {
  imageId: string;
  ticketId: string;
  type: TicketImageType;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  createdAt: string;
}
