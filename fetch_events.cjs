const { rpc, xdr, scValToNative } = require('@stellar/stellar-sdk');
async function run() {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const events = await server.getEvents({
    startLedger: 3740000,
    filters: [
      {
        type: 'contract',
        contractIds: ['CCFL7JYTNJSFRZGXNUYPBGUEUAJTO5QONF64ISGVFAJP52FZZCZND6AX'],
      }
    ]
  });
  const res = events.events.map(e => ({
    type: e.type,
    topic: e.topic.map(t => scValToNative(xdr.ScVal.fromXDR(t, 'base64'))),
    value: scValToNative(xdr.ScVal.fromXDR(e.value, 'base64'))
  }));
  console.log(JSON.stringify(res, null, 2));
}
run().catch(console.error);
