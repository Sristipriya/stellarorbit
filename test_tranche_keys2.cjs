const { Contract, rpc, Address, xdr } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const trancheId = 'CCDFIR4MGQC7KHZ25EZ3ELIB4QKGBWQ67ZWFS3J5UAR25FLBQBGW3QF7';

async function test() {
  const contract = new Contract(trancheId);
  const keys = ['Vault', 'ShareToken', 'PtToken', 'YtToken'];
  for (const k of keys) {
    try {
      const key = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(k)]);
      const ledgerKey = new xdr.LedgerKey.contractData({
        contract: contract.address().toScAddress(),
        key: key,
        durability: xdr.ContractDataDurability.instance()
      });
      const res = await server.getLedgerEntries([ledgerKey]);
      if (res.entries && res.entries.length > 0) {
        const val = res.entries[0].val.contractData().val();
        console.log(k, ":", Address.fromScVal(val).toString());
      } else {
        console.log(k, ": not found");
      }
    } catch (e) {
      console.log(k, "error:", e.message);
    }
  }
}
test().catch(console.error);
