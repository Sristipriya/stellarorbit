import { useState, useEffect, useCallback } from "react";
import { DefiState, fetchDefiState, wrapShares, createLendOffer, borrow, repay } from "../lib/stellar/defi";
import { useWallet } from "./use-wallet";
import { getVaultById } from "../lib/stellar/vaults";
import { ORBIT_TRANCHE_CONTRACT_ID, ORBIT_OXLM_SHARE_TOKEN_ID } from "../lib/stellar/network";

export function useDeFi(vaultId: string = "xlm") {
  const { address } = useWallet();
  const activeVault = getVaultById(vaultId);
  const [state, setState] = useState<DefiState>({
    ptBalance: "0.0000",
    ytBalance: "0.0000",
    usdcBalance: "0.0000",
    activeOffers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isWrapping, setIsWrapping] = useState(false);
  const [isLending, setIsLending] = useState(false);

  const refresh = useCallback(async () => {
    if (!address || !activeVault?.trancheId) return;
    setIsLoading(true);
    try {
      const data = await fetchDefiState(address, activeVault);
      setState(data);
    } catch (err) {
      console.error("Error fetching DeFi state:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address, activeVault]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const wrap = async (amountXlm: string) => {
    const trancheId = activeVault?.trancheId || ORBIT_TRANCHE_CONTRACT_ID;
    // shareTokenId is the oXLM share token that needs an allowance approval before wrapping
    const shareTokenId = ORBIT_OXLM_SHARE_TOKEN_ID;
    if (!address || !trancheId) {
      throw new Error("Wallet not connected or tranche contract missing.");
    }
    setIsWrapping(true);
    try {
      await wrapShares(address, amountXlm, trancheId, shareTokenId);
      await refresh();
    } catch (err) {
      console.error("Wrap error:", err);
      throw err;
    } finally {
      setIsWrapping(false);
    }
  };

  const lend = async (usdcAmount: string, interestAmount: string, colTokenId: string, colAmount: string) => {
    if (!address || !activeVault?.marketId) return;
    setIsLending(true);
    try {
      await createLendOffer(address, usdcAmount, interestAmount, colTokenId, colAmount, activeVault.marketId);
      await refresh();
    } catch (err) {
      console.error("Lend error:", err);
      throw err;
    } finally {
      setIsLending(false);
    }
  };

  const borrowLoan = async (offerId: number) => {
    if (!address || !activeVault?.marketId) return;
    try {
      await borrow(address, offerId, activeVault.marketId);
      await refresh();
    } catch (err) {
      console.error("Borrow error:", err);
      throw err;
    }
  };

  const repayLoan = async (offerId: number) => {
    if (!address || !activeVault?.marketId) return;
    try {
      await repay(address, offerId, activeVault.marketId);
      await refresh();
    } catch (err) {
      console.error("Repay error:", err);
      throw err;
    }
  };

  return {
    ...state,
    isLoading,
    isWrapping,
    isLending,
    wrap,
    lend,
    borrow: borrowLoan,
    repay: repayLoan,
    refresh,
  };
}
