const { Contract, rpc, Address, xdr, scValToNative } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const vaultId = 'CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN';

async function test() {
  const contract = new Contract(vaultId);
  const ledgerKey = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
    contract: contract.address().toScAddress(),
    key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('ShareToken')]),
    durability: xdr.ContractDataDurability.instance()
  }));
  const res = await server.getLedgerEntries([ledgerKey]);
  if (res.entries && res.entries.length > 0) {
    const val = res.entries[0].val.contractData().val();
    console.log("Vault ShareToken:", Address.fromScVal(val).toString());
  } else {
    console.log("No entry found");
  }
}
test().catch(console.error);
