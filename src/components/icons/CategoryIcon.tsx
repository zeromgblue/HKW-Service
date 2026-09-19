import {
  Armchair,
  Building2,
  Droplet,
  Laptop,
  MoreHorizontal,
  ShieldAlert,
  Snowflake,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIconName } from "@/types/ticket";

const iconMap: Record<CategoryIconName, LucideIcon> = {
  zap: Zap,
  droplet: Droplet,
  snowflake: Snowflake,
  laptop: Laptop,
  armchair: Armchair,
  building: Building2,
  "shield-alert": ShieldAlert,
  "more-horizontal": MoreHorizontal,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: CategoryIconName;
  className?: string;
}) {
  const Icon = iconMap[name];
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
