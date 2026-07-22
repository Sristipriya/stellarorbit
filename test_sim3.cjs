const { Contract, rpc, Address, TransactionBuilder, Account, nativeToScVal, xdr } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const contractId = 'CCFL7JYTNJSFRZGXNUYPBGUEUAJTO5QONF64ISGVFAJP52FZZCZND6AX';
const contract = new Contract(contractId);
async function test() {
  const raw = new TransactionBuilder(
      new Account('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT', '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('deposit', new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT').toScVal(), nativeToScVal(100000n, { type: 'i128' }), xdr.ScVal.scvVoid())).setTimeout(30).build();
  
  try {
    const tx = await server.prepareTransaction(raw);
    console.log("Prepared successfully");
  } catch (e) {
    console.error("Failed to prepare:");
    console.error(e.message || e);
  }
}
test().catch(console.error);
