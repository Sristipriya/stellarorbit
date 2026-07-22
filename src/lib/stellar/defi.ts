import {
  ORBIT_USDC_TOKEN_ID,
  ORBIT_OXLM_SHARE_TOKEN_ID,
  stroopsToXlm,
  xlmToStroops,
  HAS_REAL_CONTRACT,
} from "./network";
import { VaultMeta } from "./vaults";
import { readContract, invokeContract, addrArg, i128Arg } from "./soroban";
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

export async function fetchDefiState(address: string, vault?: VaultMeta): Promise<DefiState> {
  if (!HAS_REAL_CONTRACT || !address || !vault?.ptId || !vault?.ytId) {
    return {
      ptBalance: "0.0000",
      ytBalance: "0.0000",
      usdcBalance: "0.0000",
      activeOffers: [],
    };
  }

  const [pt, yt, usdc] = await Promise.all([
    readContract<bigint>("balance", [addrArg(address)], vault.ptId).catch(() => 0n),
    readContract<bigint>("balance", [addrArg(address)], vault.ytId).catch(() => 0n),
    readContract<bigint>("balance", [addrArg(address)], ORBIT_USDC_TOKEN_ID!).catch(() => 0n),
  ]);

  // Read offers from market (simplification, reading all offers)
  const offers: LoanOffer[] = [];
  try {
    if (vault.marketId) {
      const count = await readContract<number>("get_offer_count", [], vault.marketId).catch(() => 0);
      for (let i = 1; i <= count; i++) {
        const offer = await readContract<any>("get_offer", [nativeToScVal(i, "u32")], vault.marketId).catch(() => null);
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

export async function wrapShares(address: string, amountXlm: string, trancheId: string, shareTokenId?: string) {
  if (!HAS_REAL_CONTRACT) throw new Error("No tranche contract deployed.");
  const amountStrp = xlmToStroops(amountXlm);
  const tokenId = shareTokenId || ORBIT_OXLM_SHARE_TOKEN_ID;
  if (!tokenId) throw new Error("oXLM share token ID not configured.");

  // Step 1: Approve the tranche contract to pull oXLM shares on behalf of user.
  // This avoids nested require_auth inside the tranche's mint -> oXLM.transfer_from call.
  // Expiration ledger ~1000 ledgers from now (~1.5 hours), plenty for this session.
  const EXPIRY_LEDGER = 99999999; // far future ledger - safe for testnet
  await invokeContract(
    address,
    "approve",
    [
      addrArg(address),        // from (owner)
      addrArg(trancheId),      // spender (tranche contract)
      i128Arg(amountStrp),     // amount
      nativeToScVal(EXPIRY_LEDGER, { type: "u32" }), // expiration_ledger
    ],
    tokenId,
  );

  // Step 2: Mint PT + YT tokens by calling tranche.mint
  return invokeContract(address, "mint", [addrArg(address), i128Arg(amountStrp)], trancheId);
}

export async function createLendOffer(address: string, usdcAmount: string, interestAmount: string, colTokenId: string, colAmount: string, marketId: string) {
  if (!HAS_REAL_CONTRACT) throw new Error("No market contract deployed.");
  const usdcStrp = xlmToStroops(usdcAmount);
  const intStrp = xlmToStroops(interestAmount);
  const colStrp = xlmToStroops(colAmount);

  return invokeContract(address, "create_offer", [
    addrArg(address),
    nativeToScVal(usdcStrp, "i128"),
    nativeToScVal(intStrp, "i128"),
    nativeToScVal(100000, "u32"), // ~1 week duration
    addrArg(colTokenId),
    nativeToScVal(colStrp, "i128")
  ], marketId);
}

export async function borrow(address: string, offerId: number, marketId: string) {
  if (!HAS_REAL_CONTRACT) throw new Error("No market contract deployed.");
  return invokeContract(address, "borrow", [addrArg(address), nativeToScVal(offerId, "u32")], marketId);
}

export async function repay(address: string, offerId: number, marketId: string) {
  if (!HAS_REAL_CONTRACT) throw new Error("No market contract deployed.");
  return invokeContract(address, "repay", [addrArg(address), nativeToScVal(offerId, "u32")], marketId);
}
