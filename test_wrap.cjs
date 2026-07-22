const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal, xdr } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const trancheId = 'CDROB244AOEH72RRMXZTEPF72F4WYFN3LIVQ6LYBWN7XMLTERF6635TM';
const contract = new Contract(trancheId);

async function test() {
  const user = new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT');
  const raw = new TransactionBuilder(
      new Account(user.toString(), '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('mint', user.toScVal(), nativeToScVal(450000000n, { type: 'i128' }))).setTimeout(30).build();
  
  try {
    const tx = await server.prepareTransaction(raw);
    console.log("Wrap Shares: Prepared successfully!");
  } catch (e) {
    console.error("Wrap Shares: Failed to prepare:", e.message || e);
  }
}
test().catch(console.error);
