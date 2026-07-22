const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal, xdr } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const vaultId = 'CBLDIHKSHOXC3Q3R2YNCT54OPTX5QRALNYKK3UDNZ4KAQD7DEINJYV5P';
const contract = new Contract(vaultId);

async function test() {
  const user = new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT');
  const raw3 = new TransactionBuilder(
      new Account(user.toString(), '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('deposit', user.toScVal(), nativeToScVal(1990000000n, { type: 'i128' }), xdr.ScVal.scvVoid())).setTimeout(30).build();
  
  try {
    const tx = await server.prepareTransaction(raw3);
    console.log("3 arguments to new XLM vault: Prepared successfully!");
  } catch (e) {
    console.error("3 arguments to new XLM vault failed:", e.message || e);
  }
}
test().catch(console.error);
