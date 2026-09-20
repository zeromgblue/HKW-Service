"use client";

import { useSyncExternalStore } from "react";

const NAME_KEY = "hkw_staff_name";
const NAME_EVENT = "hkw-staff-name-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(NAME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(NAME_EVENT, callback);
  };
}

function read(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveStaffName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Storage unavailable — the name just won't persist between visits.
  }
  window.dispatchEvent(new Event(NAME_EVENT));
}

// Staff have no login, so their display name is remembered in this browser only.
export function useStaffName(): string {
  return useSyncExternalStore(subscribe, read, () => "");
}
