"use client";

import { useMemo, useSyncExternalStore } from "react";
import { isValidTicketId } from "@/lib/tickets/publicTicket";

// Teachers don't log in, so the tickets they reported are remembered in this browser only.
const KEY = "hkw_my_tickets";
const EVENT = "hkw-my-tickets-change";
const MAX = 30;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): string[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(isValidTicketId) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    // Storage unavailable — the list just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function rememberTicket(ticketId: string) {
  const ids = parse(readRaw()).filter((id) => id !== ticketId);
  write([ticketId, ...ids]);
}

export function forgetTicket(ticketId: string) {
  write(parse(readRaw()).filter((id) => id !== ticketId));
}

export function useMyTicketIds(): string[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  return useMemo(() => parse(raw), [raw]);
}
