import type { Metadata } from "next";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { copy } from "@/copy/es-AR";

export const metadata: Metadata = { title: `${copy.nav.shopping} · ${copy.appName}` };

export default function ShoppingPage() {
  return <ShoppingScreen />;
}
