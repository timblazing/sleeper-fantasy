import { useLayoutEffect, useRef } from "react";
import { TradeCalculator } from "sleeper-fantasy-dashboard";
import type { RaTrade } from "@/lib/roster-audit/types";
import { Stage } from "./_fixtures/stage";
import { TRADE_DATA, TRADE_DATA_NO_VALUES, TRADE_DATA_REDRAFT, TRADE_EVEN, TRADE_LOPSIDED } from "./_fixtures/e-trade";

/**
 * The calculator has no initial-trade prop: assets are staged by clicking suggestions and the
 * verdict comes from POST /api/roster-audit/trade. To show a graded deal statically, this frame
 * answers that one endpoint with a canned verdict and clicks the named suggestions on mount.
 */
function Staged({ receive, send, trade }: { receive: string[]; send: string[]; trade: RaTrade }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const original = window.fetch;
    window.fetch = (input, init) => String(input).includes("/api/roster-audit/trade")
      ? Promise.resolve(new Response(JSON.stringify({ trade }), { status: 200, headers: { "Content-Type": "application/json" } }))
      : original(input, init);
    const root = ref.current!;
    const stage = (side: string, names: string[]) => {
      for (const name of names) {
        const card = root.querySelector(`input[aria-label="Add an asset to ${side}"]`)?.closest("[data-slot=card]") ?? root;
        const button = [...card.querySelectorAll("button")].find((b) => b.textContent?.includes(name));
        button?.click();
      }
    };
    stage("You receive", receive);
    stage("You send", send);
    return () => { window.fetch = original; };
  }, [receive, send, trade]);
  return <div ref={ref}><TradeCalculator data={TRADE_DATA} /></div>;
}

export const EvenSwap = () => <Stage><Staged {...TRADE_EVEN} /></Stage>;

export const LopsidedDeal = () => <Stage><Staged {...TRADE_LOPSIDED} /></Stage>;

export const EmptyDynasty = () => <Stage><TradeCalculator data={TRADE_DATA} /></Stage>;

export const RedraftNoPicks = () => <Stage><TradeCalculator data={TRADE_DATA_REDRAFT} /></Stage>;

export const ValuesUnavailable = () => <Stage><TradeCalculator data={TRADE_DATA_NO_VALUES} /></Stage>;
