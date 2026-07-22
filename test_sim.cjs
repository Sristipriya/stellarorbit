const { Contract, rpc, Address, TransactionBuilder, Account } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const contractId = 'CCFL7JYTNJSFRZGXNUYPBGUEUAJTO5QONF64ISGVFAJP52FZZCZND6AX';
const contract = new Contract(contractId);
async function test() {
  const tx = await server.simulateTransaction(
    new TransactionBuilder(
      new Account('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT', '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('balance_of', new Address('GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT').toScVal())).setTimeout(30).build()
  );
  console.log(JSON.stringify(tx, null, 2));
}
test().catch(console.error);
