import { signTx } from "./wallet";

/**
 * Initiates the SEP-24 Interactive Deposit flow.
 */
export async function initiateSep24Deposit(
  userAddress: string,
  assetCode: string,
  anchorDomain: string = "testanchor.stellar.org"
): Promise<{ url: string; id: string }> {
  
  // 1. Resolve TOML manually (Stellar SDK v12+ TOML resolver might be separate)
  const tomlRes = await fetch(`https://${anchorDomain}/.well-known/stellar.toml`);
  if (!tomlRes.ok) throw new Error("Failed to fetch stellar.toml");
  const tomlText = await tomlRes.text();
  
  // Very basic TOML parsing for the specific keys we need
  const webAuthMatch = tomlText.match(/WEB_AUTH_ENDPOINT="?([^"\n]+)"?/);
  const sep24Match = tomlText.match(/TRANSFER_SERVER_SEP0024="?([^"\n]+)"?/);

  const webAuthEndpoint = webAuthMatch ? webAuthMatch[1] : null;
  const sep24Endpoint = sep24Match ? sep24Match[1] : null;

  if (!webAuthEndpoint || !sep24Endpoint) {
    throw new Error(`Anchor ${anchorDomain} does not support SEP-10 or SEP-24.`);
  }

  // 2. Get SEP-10 Challenge
  const challengeRes = await fetch(`${webAuthEndpoint}?account=${userAddress}`);
  if (!challengeRes.ok) throw new Error("Failed to get SEP-10 challenge");
  const { transaction: challengeXdr, network_passphrase } = await challengeRes.json();

  // 3. Sign Challenge (Client side using connected wallet)
  const { signedTxXdr } = await signTx(challengeXdr, network_passphrase, userAddress);

  // 4. Submit Challenge to get JWT
  const tokenRes = await fetch(webAuthEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: signedTxXdr })
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    throw new Error(`SEP-10 auth failed: ${err.error || "Unknown"}`);
  }
  const { token } = await tokenRes.json();

  // 5. Request SEP-24 Interactive URL
  const formData = new FormData();
  formData.append("asset_code", assetCode);
  formData.append("account", userAddress);
  
  const depositRes = await fetch(`${sep24Endpoint}/transactions/deposit/interactive`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  if (!depositRes.ok) {
    const err = await depositRes.json();
    throw new Error(`SEP-24 deposit failed: ${err.error || "Unknown"}`);
  }

  const result = await depositRes.json();
  
  // 6. Return the URL
  if (result.type === "interactive_customer_info_needed") {
    return { url: result.url, id: result.id };
  } else {
    throw new Error("Unexpected SEP-24 response type: " + result.type);
  }
}
