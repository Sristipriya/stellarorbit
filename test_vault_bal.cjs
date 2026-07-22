const { Contract, rpc, Address, scValToNative } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const vaultId = 'CDASKDOFEVUOFAHE6H4HJXIAR4YVJWJ4FARU6RNX4RCKBG3WX6V3AIBN';
const user = 'GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT';

async function test() {
  const contract = new Contract(vaultId);
  const res = await server.simulateTransaction(
    new (require('@stellar/stellar-sdk').TransactionBuilder)(
      new (require('@stellar/stellar-sdk').Account)(user, '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(contract.call('balance_of', new Address(user).toScVal())).setTimeout(30).build()
  );
  console.log("Vault balance_of:", scValToNative(res.result.retval));
}
test();
