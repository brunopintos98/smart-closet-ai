import type { Metadata } from "next";
import { SavedScreen } from "@/components/SavedScreen";
import { copy } from "@/copy/es-AR";

export const metadata: Metadata = { title: `${copy.nav.saved} · ${copy.appName}` };

export default function SavedPage() {
  return <SavedScreen />;
}
