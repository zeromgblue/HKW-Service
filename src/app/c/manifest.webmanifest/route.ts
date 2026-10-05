import type { MetadataRoute } from "next";

// The staff app. `id` matches the start URL it has always had, so phones that already
// installed it keep treating this as the same app.
const manifest: MetadataRoute.Manifest = {
  id: "/c",
  name: "HKW Service — ช่างซ่อม",
  short_name: "HKW ช่าง",
  description: "รับงานแจ้งซ่อมและจบงานภายในโรงเรียน",
  start_url: "/c",
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

export function GET() {
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json" } });
}
