import type { Metadata } from "next";
import { WardrobeScreen } from "@/components/wardrobe/WardrobeScreen";
import { copy } from "@/copy/es-AR";

export const metadata: Metadata = { title: `${copy.nav.wardrobe} · ${copy.appName}` };

export default function WardrobePage() {
  return <WardrobeScreen />;
}
