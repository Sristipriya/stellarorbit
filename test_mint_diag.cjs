const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const trancheId = 'CCDFIR4MGQC7KHZ25EZ3ELIB4QKGBWQ67ZWFS3J5UAR25FLBQBGW3QF7';
const contract = new Contract(trancheId);

async function test() {
  const user = new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT');
  const raw = new TransactionBuilder(
      new Account(user.toString(), '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('mint', user.toScVal(), nativeToScVal(1000000000n, { type: 'i128' }))).setTimeout(30).build();
  
  try {
    const tx = await server.prepareTransaction(raw);
    console.log("Prepared successfully!");
  } catch (e) {
    console.error("Simulation error detail:", JSON.stringify(e, null, 2));
  }
}
test().catch(console.error);
