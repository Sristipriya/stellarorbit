import {
  ORBIT_TRANCHE_CONTRACT_ID,
  ORBIT_MARKET_CONTRACT_ID,
  ORBIT_PT_TOKEN_ID,
  ORBIT_YT_TOKEN_ID,
  ORBIT_USDC_TOKEN_ID,
  stroopsToXlm,
  xlmToStroops,
  HAS_REAL_CONTRACT,
} from "./network";
import { readContract, invokeContract, addrArg } from "./soroban";
import { nativeToScVal } from "@stellar/stellar-sdk";

export interface LoanOffer {
  id: number;
  lender: string;
  usdc_amount: bigint;
  interest_amount: bigint;
  max_duration_ledgers: number;
  required_collateral_token: string;
  required_collateral_amount: bigint;
  is_active: boolean;
}

export interface DefiState {
  ptBalance: string;
  ytBalance: string;
  usdcBalance: string;
  activeOffers: LoanOffer[];
}

export async function fetchDefiState(address: string): Promise<DefiState> {
  if (!HAS_REAL_CONTRACT || !address) {
    return {
      ptBalance: "0.0000",
      ytBalance: "0.0000",
      usdcBalance: "0.0000",
      activeOffers: [],
    };
  }

  const [pt, yt, usdc] = await Promise.all([
    readContract<bigint>("balance", [addrArg(address)], ORBIT_PT_TOKEN_ID!).catch(() => 0n),
    readContract<bigint>("balance", [addrArg(address)], ORBIT_YT_TOKEN_ID!).catch(() => 0n),
    readContract<bigint>("balance", [addrArg(address)], ORBIT_USDC_TOKEN_ID!).catch(() => 0n),
  ]);

  // Read offers from market (simplification, reading all offers)
  const offers: LoanOffer[] = [];
  try {
    const count = await readContract<number>("get_offer_count", [], ORBIT_MARKET_CONTRACT_ID!).catch(() => 0);
    for (let i = 1; i <= count; i++) {
      const offer = await readContract<any>("get_offer", [nativeToScVal(i, "u32")], ORBIT_MARKET_CONTRACT_ID!).catch(() => null);
      if (offer && offer.is_active) {
        offers.push({
          id: i,
          lender: offer.lender,
          usdc_amount: BigInt(offer.usdc_amount),
          interest_amount: BigInt(offer.interest_amount),
          max_duration_ledgers: offer.max_duration_ledgers,
          required_collateral_token: offer.required_collateral_token,
          required_collateral_amount: BigInt(offer.required_collateral_amount),
          is_active: offer.is_active,
        });
      }
    }
  } catch (err) {
    console.error("Failed to read market offers", err);
  }

  return {
    ptBalance: stroopsToXlm(pt),
    ytBalance: stroopsToXlm(yt),
    usdcBalance: stroopsToXlm(usdc),
    activeOffers: offers,
  };
}

export async function wrapShares(address: string, amountXlm: string) {
  if (!HAS_REAL_CONTRACT) throw new Error("No tranche contract deployed.");
  const amountStrp = xlmToStroops(amountXlm);
  return invokeContract("mint", [addrArg(address), nativeToScVal(amountStrp, "i128")], ORBIT_TRANCHE_CONTRACT_ID!);
}

export async function createLendOffer(address: string, usdcAmount: string, interestAmount: string, colTokenId: string, colAmount: string) {
  if (!HAS_REAL_CONTRACT) throw new Error("No market contract deployed.");
  const usdcStrp = xlmToStroops(usdcAmount);
  const intStrp = xlmToStroops(interestAmount);
  const colStrp = xlmToStroops(colAmount);

  return invokeContract("create_offer", [
    addrArg(address),
    nativeToScVal(usdcStrp, "i128"),
    nativeToScVal(intStrp, "i128"),
    nativeToScVal(100000, "u32"), // ~1 week duration
    addrArg(colTokenId),
    nativeToScVal(colStrp, "i128")
  ], ORBIT_MARKET_CONTRACT_ID!);
}

export async function borrow(address: string, offerId: number) {
  if (!HAS_REAL_CONTRACT) throw new Error("No market contract deployed.");
  return invokeContract("borrow", [addrArg(address), nativeToScVal(offerId, "u32")], ORBIT_MARKET_CONTRACT_ID!);
}

export async function repay(address: string, offerId: number) {
  if (!HAS_REAL_CONTRACT) throw new Error("No market contract deployed.");
  return invokeContract("repay", [addrArg(address), nativeToScVal(offerId, "u32")], ORBIT_MARKET_CONTRACT_ID!);
}
