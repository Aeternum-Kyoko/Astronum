import type { SkySnapshot } from "@/lib/skySnapshot";
import SkyDialInteractive from "./SkyDialInteractive";
export default function SkyDial({ sky, className = "", locale = "en" }: { sky: SkySnapshot; className?: string; locale?: "en" | "hi" }) {
  return <SkyDialInteractive positions={sky.positions} at={sky.at.toISOString()} className={className} locale={locale} />;
}
