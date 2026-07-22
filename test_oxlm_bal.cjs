const { Contract, rpc, Address, scValToNative } = require('@stellar/stellar-sdk');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(rpcUrl);
const shareTokenId = 'CDVS3OBGU6JERC4MZAW6BW75HLMVW5QFBCHUKPV5VEWGVXGJBRR5HIAJ';
const user = 'GBIRVAP2R5BT3DJ4SOP3ZVEVHD5PVKPJ5ZBLWYRT2MVZPEWTEEB5NICT';

async function test() {
  const c = new Contract(shareTokenId);
  const res = await server.simulateTransaction(
    new (require('@stellar/stellar-sdk').TransactionBuilder)(
      new (require('@stellar/stellar-sdk').Account)(user, '0'),
      { fee: '100', networkPassphrase: 'Test SDF Network ; September 2015' }
    ).addOperation(c.call('balance', new Address(user).toScVal())).setTimeout(30).build()
  );
  console.log("oXLM ShareToken balance for GBIR:", scValToNative(res.result.retval));
}
test();
