const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal, xdr } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const contractId = 'CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN';
const contract = new Contract(contractId);
async function test() {
  const raw3 = new TransactionBuilder(
      new Account('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT', '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('deposit', new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT').toScVal(), nativeToScVal(100000n, { type: 'i128' }), xdr.ScVal.scvVoid())).setTimeout(30).build();
  
  try {
    const tx = await server.prepareTransaction(raw3);
    console.log("3 arguments: Prepared successfully");
  } catch (e) {
    console.error("3 arguments: Failed to prepare:", e.message || e);
  }

  const raw2 = new TransactionBuilder(
      new Account('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT', '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('deposit', new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT').toScVal(), nativeToScVal(100000n, { type: 'i128' }))).setTimeout(30).build();
  
  try {
    const tx2 = await server.prepareTransaction(raw2);
    console.log("2 arguments: Prepared successfully");
  } catch (e) {
    console.error("2 arguments: Failed to prepare:", e.message || e);
  }
}
test().catch(console.error);
