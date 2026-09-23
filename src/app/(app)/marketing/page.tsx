import type { Metadata } from "next";
import MarketingStudio from "@/components/marketing/MarketingStudio";
import { requireStudio } from "@/lib/auth";
import { marketingAiAvailable } from "@/lib/marketing/ai";

export const metadata: Metadata = { title: "MUA Marketing AI · Studio Desk" };

export default async function MarketingPage() {
  const { studio } = await requireStudio();
  return <MarketingStudio brandName={studio.name === "My Studio" ? "" : studio.name} aiReady={marketingAiAvailable()} />;
}
