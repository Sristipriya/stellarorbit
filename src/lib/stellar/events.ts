/**
 * Activity event source.
 *
 * REAL contract mode: polls Soroban RPC for the vault contract's "Dep" / "Wd"
 * events and reconciles them into a normalised ActivityEvent[].
 *
 * DEMO mode (no contract): polls Horizon for the connected account's recent
 * transactions and surfaces any with a memo starting with "orbit:".
 *
 * Either way, the UI consumes the same shape so ActivityFeed doesn't care.
 */
import { Horizon } from "@stellar/stellar-sdk";
import { HAS_REAL_CONTRACT, NETWORK } from "./network";
import { fetchContractEvents, latestLedger } from "./soroban";

export type ActivityEvent = {
  id: string;
  kind: "deposit" | "withdraw";
  address: string;
  amountStroops: bigint;
  sharesStroops: bigint;
  txHash: string;
  at: number;
  confirmed: boolean; // on real contract path always true (RPC returns confirmed ledger events)
};

/** How many ledgers back to scan on first load. ~5s/ledger on Stellar → ~30 min. */
const LOOKBACK_LEDGERS = 360;

function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.trunc(v));
  if (typeof v === "string") return BigInt(v);
  return 0n;
}

/* ─────────────────────────── REAL contract events ─────────────────────────── */

let realStartLedger: number | null = null;
const realSeen = new Set<string>();

async function pollRealEvents(address: string | null, contractId: string): Promise<ActivityEvent[]> {
  if (realStartLedger == null) {
    const head = await latestLedger();
    realStartLedger = Math.max(1, head - LOOKBACK_LEDGERS);
  }
  const raw = await fetchContractEvents(realStartLedger, contractId);
  const out: ActivityEvent[] = [];
  for (const ev of raw) {
    const key = ev.id;
    if (realSeen.has(key)) continue;
    realSeen.add(key);

    // contract publishes (("Dep"|"Wd",), (from, amount, shares))
    const [from, amount, shares] = ev.values;
    const kind = ev.topic0 === "Dep" ? "deposit" : ev.topic0 === "Wd" ? "withdraw" : null;
    if (!kind) continue;

    const eventAddress = typeof from === "string" ? from : String(from);
    if (address && eventAddress !== address) continue;

    out.push({
      id: key,
      kind,
      address: eventAddress,
      amountStroops: toBigInt(amount),
      sharesStroops: toBigInt(shares),
      txHash: ev.txHash,
      at: Date.now(),
      confirmed: true,
    });

    // advance window so we don't re-scan everything next tick
    realStartLedger = Math.max(realStartLedger, ev.ledger);
  }
  return out;
}

/* ─────────────────────────── DEMO horizon-memo events ─────────────────────── */

const demoSeen = new Set<string>();
let demoHorizon: Horizon.Server | null = null;
function horizon(): Horizon.Server {
  if (!demoHorizon) demoHorizon = new Horizon.Server(NETWORK.horizonUrl);
  return demoHorizon;
}

/**
 * Memo convention written by demo-mode submitMarkerTx in vault.ts:
 *   "orbit:dep:<xlm>"  | "orbit:wd:<xlm>"
 */
function parseMemo(memo: string | undefined): { kind: "deposit" | "withdraw"; xlm: string } | null {
  if (!memo) return null;
  const m = memo.match(/^orbit:(dep|wd):(.+)$/);
  if (!m) return null;
  return { kind: m[1] === "dep" ? "deposit" : "withdraw", xlm: m[2] };
}

function xlmToStroops(s: string): bigint {
  const [w, f = ""] = s.split(".");
  return BigInt(w || "0") * 10_000_000n + BigInt((f + "0000000").slice(0, 7));
}

async function pollDemoEvents(address: string): Promise<ActivityEvent[]> {
  const page = await horizon().transactions().forAccount(address).order("desc").limit(25).call();
  const out: ActivityEvent[] = [];
  for (const tx of page.records) {
    if (demoSeen.has(tx.hash)) continue;
    demoSeen.add(tx.hash);
    if (tx.memo_type !== "text") continue;
    const parsed = parseMemo(tx.memo);
    if (!parsed) continue;
    const amountStroops = xlmToStroops(parsed.xlm);
    out.push({
      id: tx.hash,
      kind: parsed.kind,
      address,
      amountStroops,
      sharesStroops: amountStroops, // demo: 1:1 share price
      txHash: tx.hash,
      at: Date.parse(tx.created_at),
      confirmed: tx.successful,
    });
  }
  return out;
}

/* ─────────────────────────── unified poller ────────────────────────────── */

export async function pollActivity(address: string | null, contractId: string | undefined): Promise<ActivityEvent[]> {
  if (HAS_REAL_CONTRACT && contractId) return pollRealEvents(address, contractId);
  if (!address) return [];
  return pollDemoEvents(address);
}

/** Reset state — call when wallet changes so we don't bleed across users. */
export function resetActivityPoller() {
  realStartLedger = null;
  realSeen.clear();
  demoSeen.clear();
}
