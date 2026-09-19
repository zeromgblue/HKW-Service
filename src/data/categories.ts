import type { Category } from "@/types/ticket";

// Default category list. Editable later by Admin (see spec section 1.2 / 7.5).
export const defaultCategories: Category[] = [
  { categoryId: "electrical", name: "ไฟฟ้า / แสงสว่าง", icon: "zap", active: true, sortOrder: 1 },
  { categoryId: "plumbing", name: "ประปา / น้ำรั่ว", icon: "droplet", active: true, sortOrder: 2 },
  { categoryId: "aircon", name: "เครื่องปรับอากาศ", icon: "snowflake", active: true, sortOrder: 3 },
  { categoryId: "it", name: "คอมพิวเตอร์ / เทคโนโลยี", icon: "laptop", active: true, sortOrder: 4 },
  { categoryId: "furniture", name: "โต๊ะ / เก้าอี้ / เฟอร์นิเจอร์", icon: "armchair", active: true, sortOrder: 5 },
  { categoryId: "building", name: "อาคารสถานที่ / โครงสร้าง", icon: "building", active: true, sortOrder: 6 },
  { categoryId: "safety", name: "ความปลอดภัย", icon: "shield-alert", active: true, sortOrder: 7 },
  { categoryId: "other", name: "อื่น ๆ", icon: "more-horizontal", active: true, sortOrder: 99 },
];
