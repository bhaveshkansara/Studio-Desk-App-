// TEMPORARY test harness - delete after UI testing.
import MarketingStudio from "@/components/marketing/MarketingStudio";
import ResultCards from "@/components/marketing/ResultCards";
import { calendarDates, normalizeResult } from "@/lib/marketing/ai";
import { EMPTY_DETAILS } from "@/lib/marketing/constants";
import { sampleResult } from "@/lib/marketing/sample";

export default async function Harness({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const sample = normalizeResult(sampleResult({ ...EMPTY_DETAILS, location: "Jaipur" }), calendarDates(), true);
  return (
    <div className="app">
      <main>
        <script dangerouslySetInnerHTML={{ __html: `window.__mkSample=${JSON.stringify(sample)}` }} />
        {view === "cards" ? <ResultCards result={sample} /> : <MarketingStudio brandName="Soniya Rozario" aiReady />}
      </main>
    </div>
  );
}
