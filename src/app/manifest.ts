import type { MetadataRoute } from "next";

// The app teachers install to report repairs. Staff pages under /c link their own manifest
// (see c/manifest.webmanifest), so the two install as separate home-screen apps.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "HKW Service — แจ้งซ่อมโรงเรียน",
    short_name: "HKW Service",
    description: "แจ้งซ่อมและติดตามสถานะงานซ่อมภายในโรงเรียน",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f8fa",
    theme_color: "#2563eb",
    lang: "th",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
