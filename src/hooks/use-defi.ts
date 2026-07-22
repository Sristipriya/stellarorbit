import { useState, useEffect, useCallback } from "react";
import { DefiState, fetchDefiState, wrapShares, createLendOffer, borrow, repay } from "../lib/stellar/defi";
import { useWallet } from "./use-wallet";
import { useVault } from "./use-vault";

export function useDeFi() {
  const { address } = useWallet();
  const { activeVault } = useVault();
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
    if (!address || !activeVault?.trancheId) return;
    setIsWrapping(true);
    try {
      await wrapShares(address, amountXlm, activeVault.trancheId);
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
