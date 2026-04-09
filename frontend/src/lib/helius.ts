const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || "https://devnet.helius-rpc.com/?api-key=" + process.env.NEXT_PUBLIC_HELIUS_API_KEY;

export async function getSrecsByWallet(walletAddress: string) {
  const response = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "helios",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: walletAddress,
        page: 1,
        limit: 50,
      },
    }),
  });
  const data = await response.json();
  return data.result?.items || [];
}
