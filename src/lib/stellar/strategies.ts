/**
 * Orbit Automated Strategies & DAO Marketplace Protocol
 */

import { recordUserTransaction } from "@/lib/user-transactions";

export interface YieldStrategy {
  id: string;
  name: string;
  author: string;
  description: string;
  apy: number; // e.g. 14.8
  risk: "Low" | "Medium" | "High";
  tvlUsd: number;
  status: "active" | "proposed";
  votes: number;
  targetVotes: number;
  protocols: string[];
  executionFrequency: string; // e.g. "Every 6 Hours"
  asset: string;
  isOfficial?: boolean;
}

export interface UserStrategyPosition {
  strategyId: string;
  depositedAmount: number;
  depositedAt: number;
  earnedYield: number;
  lastRebalancedAt: number;
}

export const DEFAULT_STRATEGIES: YieldStrategy[] = [
  {
    id: "strat_blend_auto",
    name: "Blend Protocol Auto-Compounder",
    author: "Orbit Core",
    description: "Automatically harvests lending rewards from the primary XLM money market and re-deposits to maximize continuous compounded APY.",
    apy: 14.8,
    risk: "Low",
    tvlUsd: 68420,
    status: "active",
    votes: 8400,
    targetVotes: 5000,
    protocols: ["Blend", "Orbit Vault"],
    executionFrequency: "Every 4 Hours",
    asset: "XLM",
    isOfficial: true,
  },
  {
    id: "strat_pt_maximizer",
    name: "PT Fixed-Yield Maximizer",
    author: "Orbit Core",
    description: "Dynamically sweeps discounted Principal Tranche (PT) tokens across staggered maturities to lock in risk-free yield arbitrage.",
    apy: 19.4,
    risk: "Low",
    tvlUsd: 42150,
    status: "active",
    votes: 6200,
    targetVotes: 5000,
    protocols: ["Orbit Tranche", "Phoenix DEX"],
    executionFrequency: "Daily at 00:00 UTC",
    asset: "XLM",
    isOfficial: true,
  },
  {
    id: "strat_soroswap_lp",
    name: "Soroswap AQUA/XLM LP Compounder",
    author: "DeFi Ninja",
    description: "Provides dual-sided liquidity on Soroswap, continuously claims AQUA emission incentives, and auto-mints new LP positions.",
    apy: 28.2,
    risk: "Medium",
    tvlUsd: 31200,
    status: "active",
    votes: 5100,
    targetVotes: 5000,
    protocols: ["Soroswap", "Aqua Network"],
    executionFrequency: "Every 6 Hours",
    asset: "XLM",
    isOfficial: false,
  },
  {
    id: "strat_delta_neutral",
    name: "Delta-Neutral Funding Shield",
    author: "Yield Maximizer",
    description: "Pairs spot XLM vault deposits with synthetic hedging to eliminate market volatility while farming funding rate differentials.",
    apy: 22.5,
    risk: "Medium",
    tvlUsd: 18500,
    status: "proposed",
    votes: 3850,
    targetVotes: 5000,
    protocols: ["Orbit Vault", "Perp DEX"],
    executionFrequency: "Continuous",
    asset: "XLM",
    isOfficial: false,
  },
  {
    id: "strat_phoenix_maker",
    name: "Phoenix Orderbook Market Making",
    author: "Algo Chad",
    description: "Places algorithmic bid/ask liquidity on Phoenix CLOB orderbook around tight spreads to capture maker rebates and trading fees.",
    apy: 34.0,
    risk: "High",
    tvlUsd: 9200,
    status: "proposed",
    votes: 2450,
    targetVotes: 5000,
    protocols: ["Phoenix DEX", "Stellar Orderbook"],
    executionFrequency: "Per Ledger Block",
    asset: "XLM",
    isOfficial: false,
  },
];

const STRATEGIES_STORAGE_KEY = "orbit:strategies:list";
const STRATEGY_POSITIONS_PREFIX = "orbit:strategies:positions:";

export function getStoredStrategies(): YieldStrategy[] {
  if (typeof window === "undefined") return DEFAULT_STRATEGIES;
  try {
    const raw = localStorage.getItem(STRATEGIES_STORAGE_KEY);
    if (!raw) return DEFAULT_STRATEGIES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STRATEGIES;
  }
}

export function saveStoredStrategies(list: YieldStrategy[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save strategies:", e);
  }
}

export function getUserStrategyPositions(address: string): Record<string, UserStrategyPosition> {
  if (typeof window === "undefined" || !address) return {};
  try {
    const raw = localStorage.getItem(`${STRATEGY_POSITIONS_PREFIX}${address.toLowerCase()}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveUserStrategyPositions(
  address: string,
  pos: Record<string, UserStrategyPosition>
): void {
  if (typeof window === "undefined" || !address) return;
  try {
    localStorage.setItem(`${STRATEGY_POSITIONS_PREFIX}${address.toLowerCase()}`, JSON.stringify(pos));
  } catch (e) {
    console.error("Failed to save strategy positions:", e);
  }
}

export async function depositToStrategy(
  address: string,
  strategyId: string,
  amount: number
): Promise<{ txHash: string; position: UserStrategyPosition }> {
  if (!address || amount <= 0) throw new Error("Invalid deposit parameters");

  const strategies = getStoredStrategies();
  const strat = strategies.find((s) => s.id === strategyId);
  if (!strat) throw new Error("Strategy not found");

  const positions = getUserStrategyPositions(address);
  const currentPos = positions[strategyId];
  const now = Date.now();

  const newPos: UserStrategyPosition = {
    strategyId,
    depositedAmount: (currentPos?.depositedAmount || 0) + amount,
    depositedAt: currentPos?.depositedAt || now,
    earnedYield: currentPos?.earnedYield || 0,
    lastRebalancedAt: now,
  };

  positions[strategyId] = newPos;
  saveUserStrategyPositions(address, positions);

  // Update strategy TVL
  strat.tvlUsd += amount * 0.12; // approximate USD value
  saveStoredStrategies(strategies);

  const txHash = `0x_strat_dep_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 8)}`;

  await recordUserTransaction({
    walletAddress: address,
    txHash,
    type: "deposit",
    amount,
    asset: strat.asset,
    vaultId: strategyId,
    shares: String(amount),
    status: "success",
    metadata: {
      strategyName: strat.name,
      apy: strat.apy,
      action: "strategy_deposit",
    },
  });

  return { txHash, position: newPos };
}

export async function withdrawFromStrategy(
  address: string,
  strategyId: string,
  amount: number
): Promise<{ txHash: string; position: UserStrategyPosition }> {
  if (!address || amount <= 0) throw new Error("Invalid withdrawal parameters");

  const strategies = getStoredStrategies();
  const strat = strategies.find((s) => s.id === strategyId);
  if (!strat) throw new Error("Strategy not found");

  const positions = getUserStrategyPositions(address);
  const currentPos = positions[strategyId];

  if (!currentPos || currentPos.depositedAmount < amount) {
    throw new Error("Insufficient strategy deposit balance");
  }

  const remaining = currentPos.depositedAmount - amount;
  const now = Date.now();

  const newPos: UserStrategyPosition = {
    ...currentPos,
    depositedAmount: remaining,
    lastRebalancedAt: now,
  };

  if (remaining <= 0) {
    delete positions[strategyId];
  } else {
    positions[strategyId] = newPos;
  }
  saveUserStrategyPositions(address, positions);

  // Update strategy TVL
  strat.tvlUsd = Math.max(0, strat.tvlUsd - amount * 0.12);
  saveStoredStrategies(strategies);

  const txHash = `0x_strat_wth_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 8)}`;

  await recordUserTransaction({
    walletAddress: address,
    txHash,
    type: "withdraw",
    amount,
    asset: strat.asset,
    vaultId: strategyId,
    shares: String(amount),
    status: "success",
    metadata: {
      strategyName: strat.name,
      action: "strategy_withdraw",
    },
  });

  return { txHash, position: newPos };
}

export async function voteForStrategy(
  strategyId: string,
  pointsToVote = 100
): Promise<YieldStrategy> {
  const list = getStoredStrategies();
  const strat = list.find((s) => s.id === strategyId);
  if (!strat) throw new Error("Strategy not found");

  strat.votes += pointsToVote;
  if (strat.votes >= strat.targetVotes && strat.status === "proposed") {
    strat.status = "active";
  }

  saveStoredStrategies(list);
  return strat;
}

export async function proposeNewStrategy(
  authorName: string,
  name: string,
  description: string,
  targetApy: number,
  risk: "Low" | "Medium" | "High",
  protocols: string[]
): Promise<YieldStrategy> {
  const list = getStoredStrategies();

  const newStrat: YieldStrategy = {
    id: `strat_custom_${Date.now().toString(16)}`,
    name,
    author: authorName || "Community Strategist",
    description,
    apy: targetApy,
    risk,
    tvlUsd: 0,
    status: "proposed",
    votes: 100, // creator vote
    targetVotes: 5000,
    protocols: protocols.length > 0 ? protocols : ["Orbit Protocol"],
    executionFrequency: "Every 12 Hours",
    asset: "XLM",
    isOfficial: false,
  };

  list.push(newStrat);
  saveStoredStrategies(list);
  return newStrat;
}
