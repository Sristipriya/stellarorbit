const { Contract, rpc, Address, xdr } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const vaultId = 'CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN';

async function test() {
  const contract = new Contract(vaultId);
  const key = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('ShareToken')]);
  const ledgerKey = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
    contract: contract.address().toScAddress(),
    key: key,
    durability: xdr.ContractDataDurability.persistent()
  }));
  const res = await server.getLedgerEntries([ledgerKey]);
  if (res.entries && res.entries.length > 0) {
    const val = res.entries[0].val.contractData().val();
    console.log("Vault ShareToken:", Address.fromScVal(val).toString());
  } else {
    console.log("No persistent entry, trying instance...");
    const keyInst = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
      contract: contract.address().toScAddress(),
      key: key,
      durability: xdr.ContractDataDurability.instance()
    }));
    const resInst = await server.getLedgerEntries([keyInst]);
    if (resInst.entries && resInst.entries.length > 0) {
      const val = resInst.entries[0].val.contractData().val();
      console.log("Vault ShareToken:", Address.fromScVal(val).toString());
    }
  }
}
test().catch(console.error);
