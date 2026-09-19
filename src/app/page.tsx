import { HomeHero } from "@/components/home/HomeHero";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl"
      />
      <HomeHero />
    </main>
  );
}
