"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { BellRing, Camera, EyeOff, Wrench } from "lucide-react";
import { MyTickets } from "@/components/home/MyTickets";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const features = [
  {
    icon: Wrench,
    title: "แจ้งซ่อมได้ทันที",
    desc: "ไม่ต้องเข้าสู่ระบบ",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: EyeOff,
    title: "ไม่ระบุตัวตนได้",
    desc: "เป็นส่วนตัว ปลอดภัย",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Camera,
    title: "แนบรูปประกอบได้",
    desc: "ถ่ายรูปปัญหาส่งให้ช่างดู",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: BellRing,
    title: "ช่างรับทราบทันที",
    desc: "งานเข้าถึงช่างแบบเรียลไทม์",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export function HomeHero() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8"
    >
      <motion.div variants={item} className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg shadow-blue-600/15 ring-1 ring-neutral-200/60">
          <Image
            src="/school-logo.png"
            alt="โลโก้โรงเรียน"
            width={79}
            height={78}
            priority
            className="h-28 w-28 object-contain"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-400">ระบบแจ้งซ่อมโรงเรียน</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-blue-600">HKW</span>{" "}
            <span className="text-neutral-900">Service</span>
          </h1>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-neutral-500">
          แอปสำหรับครูและบุคลากรแจ้งปัญหาหรือขอซ่อมสิ่งของ/สถานที่ภายในโรงเรียน
          ใช้งานง่ายเหมือนแอปในมือถือ และส่งถึงช่างทันที
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${f.color}`}>
              <f.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{f.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-neutral-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <MyTickets />
      </motion.div>

      <div className="flex w-full flex-col gap-3">
        <motion.div variants={item}>
          <Link
            href="/report"
            className="group flex items-center gap-4 rounded-2xl bg-blue-600 px-5 py-4 text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-transform group-active:scale-90">
              <Wrench className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="flex flex-1 flex-col text-left">
              <span className="text-base font-semibold">แจ้งซ่อม</span>
              <span className="text-xs text-blue-100">รายงานปัญหาที่พบ</span>
            </span>
          </Link>
        </motion.div>
      </div>

      <motion.p variants={item} className="text-center text-xs text-neutral-400">
        พัฒนาเพื่อโรงเรียน • เวอร์ชัน MVP
      </motion.p>
    </motion.div>
  );
}
